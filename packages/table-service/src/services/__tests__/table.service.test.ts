import { PrismaClient } from '@prisma/client';
import { TableService } from '../table.service';
import { TableRepository } from '../../repositories/table.repository';
import { ConflictError, BadRequestError, NotFoundError } from '../../errors/AppError';
import axios from 'axios';

jest.mock('../../repositories/table.repository');
jest.mock('axios');
jest.mock('../../config/env', () => ({
    getEnvConfig: () => ({ RESERVATION_SERVICE_URL: 'http://res' })
}));

describe('TableService', () => {
    let service: TableService;
    let mockRepo: jest.Mocked<TableRepository>;
    let prisma: any;

    beforeEach(() => {
        jest.clearAllMocks();
        prisma = {
            table: {
                findUnique: jest.fn(),
            },
            restaurant: {
                findUnique: jest.fn(),
            }
        } as any;
        service = new TableService(prisma as PrismaClient);
        mockRepo = (service as any).tableRepository;
    });

    const mockDate = new Date();
    const mockTableData = {
        id: 't1',
        restaurantId: 'r1',
        tableNumber: '1',
        capacity: 4,
        minPartySize: 2,
        status: 'AVAILABLE' as const,
        statusUpdatedAt: mockDate,
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    it('should create a table', async () => {
        prisma.table.findUnique.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(mockTableData);
        const result = await service.createTable({ restaurantId: 'r1', tableNumber: '1', capacity: 4 } as any);
        expect(result.id).toBe('t1');
    });

    it('should throw ConflictError if table number exists', async () => {
        prisma.table.findUnique.mockResolvedValue({ id: 'existing' });
        await expect(service.createTable({ restaurantId: 'r1', tableNumber: '1' } as any)).rejects.toThrow(ConflictError);
    });

    it('should get table by id', async () => {
        mockRepo.findById.mockResolvedValue(mockTableData);
        const result = await service.getTableById('t1');
        expect(result.tableNumber).toBe('1');
    });

    it('should throw NotFoundError if table not found in getById', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(service.getTableById('none')).rejects.toThrow(NotFoundError);
    });

    it('should get tables by restaurant', async () => {
        mockRepo.findByRestaurant.mockResolvedValue([mockTableData]);
        const result = await service.getTablesByRestaurant('r1');
        expect(result).toHaveLength(1);
    });

    it('should get tables by ids', async () => {
        mockRepo.findByIds.mockResolvedValue([mockTableData]);
        const result = await service.getTablesByIds(['t1']);
        expect(result).toHaveLength(1);
    });

    it('should return empty array if no ids provided for getTablesByIds', async () => {
        const result = await service.getTablesByIds([]);
        expect(result).toEqual([]);
    });

    it('should update table', async () => {
        mockRepo.findById.mockResolvedValue(mockTableData);
        mockRepo.update.mockResolvedValue({ ...mockTableData, capacity: 5 });
        const result = await service.updateTable('t1', { capacity: 5 });
        expect(result.capacity).toBe(5);
    });

    it('should throw NotFoundError if table not found in update', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(service.updateTable('none', {})).rejects.toThrow(NotFoundError);
    });

    it('should check conflicts when updating table number', async () => {
        mockRepo.findById.mockResolvedValue(mockTableData);
        prisma.table.findUnique.mockResolvedValue({ id: 'other' });
        await expect(service.updateTable('t1', { tableNumber: '2' })).rejects.toThrow(ConflictError);
    });

    it('should update table status', async () => {
        mockRepo.findById.mockResolvedValue(mockTableData);
        mockRepo.updateStatus.mockResolvedValue({ ...mockTableData, status: 'OCCUPIED' as const });
        const result = await service.updateTableStatus('t1', 'OCCUPIED');
        expect(result.status).toBe('OCCUPIED');
    });

    it('should throw NotFoundError if table not found in updateStatus', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(service.updateTableStatus('none', 'AVAILABLE')).rejects.toThrow(NotFoundError);
    });

    it('should delete table', async () => {
        mockRepo.findById.mockResolvedValue(mockTableData);
        await service.deleteTable('t1');
        expect(mockRepo.delete).toHaveBeenCalledWith('t1');
    });

    it('should throw NotFoundError if table not found in delete', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(service.deleteTable('none')).rejects.toThrow(NotFoundError);
    });

    describe('findAvailableTables', () => {
        const mockRestaurant = {
            id: 'r1',
            openingTime: new Date('1970-01-01T09:00:00Z'),
            closingTime: new Date('1970-01-01T22:00:00Z'),
        };

        it('should find available tables', async () => {
            prisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
            (axios.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
            mockRepo.findAvailableTables.mockResolvedValue([mockTableData]);

            const result = await service.findAvailableTables('r1', '2026-01-20', '18:00', 2);
            expect(result).toHaveLength(1);
            expect(result[0]?.available).toBe(true);
        });

        it('should throw BadRequestError if outside hours', async () => {
            prisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
            await expect(service.findAvailableTables('r1', '2026-01-20', '08:00', 2)).rejects.toThrow(BadRequestError);
        });

        it('should mark reserved tables as unavailable', async () => {
            prisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
            (axios.get as jest.Mock).mockResolvedValue({ data: { data: ['t1'] } });
            mockRepo.findAvailableTables.mockResolvedValue([mockTableData]);

            const result = await service.findAvailableTables('r1', '2026-01-20', '18:00', 2);
            expect(result[0]?.available).toBe(false);
        });

        it('should return empty if party size is too large for all tables', async () => {
            prisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
            (axios.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
            mockRepo.findAvailableTables.mockResolvedValue([mockTableData]); // capacity 4, min 2

            const result = await service.findAvailableTables('r1', '2026-01-20', '18:00', 5);
            expect(result).toHaveLength(0);
        });

        it('should throw NotFoundError if restaurant not found', async () => {
            prisma.restaurant.findUnique.mockResolvedValue(null);
            await expect(service.findAvailableTables('none', '2026-01-20', '18:00', 2)).rejects.toThrow(NotFoundError);
        });

        it('should handle axios failure gracefully', async () => {
            prisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
            (axios.get as jest.Mock).mockRejectedValue(new Error('Axios error'));
            mockRepo.findAvailableTables.mockResolvedValue([mockTableData]);

            const result = await service.findAvailableTables('r1', '2026-01-20', '18:00', 2);
            expect(result).toHaveLength(1);
        });
        it('should return 0 for score if party size exceeds capacity (direct call)', () => {
             const score = (service as any).calculateScore({ capacity: 2, minPartySize: 1 }, 3);
             expect(score).toBe(0);
        });

        it('should return 0 for score if party size below min (direct call)', () => {
            const score = (service as any).calculateScore({ capacity: 5, minPartySize: 4 }, 2);
            expect(score).toBe(0);
       });
    });
});
