import { PrismaClient } from '@prisma/client';
import { TableRepository } from '../table.repository';

describe('TableRepository', () => {
  let repository: TableRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      table: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    repository = new TableRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('constructor', () => {
    it('should throw error if prisma is missing', () => {
      expect(() => new TableRepository(null as any)).toThrow('PrismaClient instance is required');
    });
  });

  describe('create', () => {
    it('should create a table', async () => {
      const data = {
        restaurantId: 'rest-1',
        tableNumber: '1A',
        capacity: 4,
      };
      mockPrisma.table.create.mockResolvedValue({ id: 'table-1', ...data });
      await repository.create(data);
      expect(mockPrisma.table.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find table with restaurant', async () => {
      mockPrisma.table.findUnique.mockResolvedValue({ id: 't1' });
      await repository.findById('t1');
      expect(mockPrisma.table.findUnique).toHaveBeenCalledWith({
        where: { id: 't1' },
        include: { restaurant: true },
      });
    });
  });

  describe('findByIds', () => {
    it('should handle empty ids', async () => {
        expect(await repository.findByIds([])).toEqual([]);
    });

    it('should find many', async () => {
        mockPrisma.table.findMany.mockResolvedValue([]);
        await repository.findByIds(['t1']);
        expect(mockPrisma.table.findMany).toHaveBeenCalled();
    });
  });

  describe('findByRestaurant', () => {
    it('should find by restaurant', async () => {
        mockPrisma.table.findMany.mockResolvedValue([]);
        await repository.findByRestaurant('r1');
        expect(mockPrisma.table.findMany).toHaveBeenCalledWith({
            where: { restaurantId: 'r1' },
            orderBy: { tableNumber: 'asc' }
        });
    });
  });

  describe('findByRestaurantAndStatus', () => {
    it('should find by restaurant and status', async () => {
        mockPrisma.table.findMany.mockResolvedValue([]);
        await repository.findByRestaurantAndStatus('r1', 'AVAILABLE');
        expect(mockPrisma.table.findMany).toHaveBeenCalledWith({
            where: { restaurantId: 'r1', status: 'AVAILABLE' },
            orderBy: { tableNumber: 'asc' }
        });
    });
  });

  describe('update', () => {
    it('should update all fields', async () => {
        mockPrisma.table.update.mockResolvedValue({ id: 't1' });
        await repository.update('t1', { tableNumber: '2', capacity: 4, minPartySize: 2, status: 'OCCUPIED' });
        expect(mockPrisma.table.update).toHaveBeenCalledWith({
            where: { id: 't1' },
            data: expect.objectContaining({ capacity: 4, minPartySize: 2 })
        });
    });
  });

  describe('updateStatus', () => {
    it('should update status only', async () => {
        mockPrisma.table.update.mockResolvedValue({ id: 't1' });
        await repository.updateStatus('t1', 'RESERVED');
        expect(mockPrisma.table.update).toHaveBeenCalledWith({
            where: { id: 't1' },
            data: expect.objectContaining({ status: 'RESERVED' })
        });
    });
  });

  describe('findAvailableTables', () => {
    it('should find available tables with capacity range', async () => {
        mockPrisma.table.findMany.mockResolvedValue([]);
        await repository.findAvailableTables('r1', 2, 4);
        expect(mockPrisma.table.findMany).toHaveBeenCalledWith({
            where: {
                restaurantId: 'r1',
                status: 'AVAILABLE',
                capacity: { gte: 2, lte: 4 }
            },
            orderBy: { capacity: 'asc' }
        });
    });

    it('should find available tables without maxCapacity', async () => {
        mockPrisma.table.findMany.mockResolvedValue([]);
        await repository.findAvailableTables('r1', 2);
        expect(mockPrisma.table.findMany).toHaveBeenCalledWith({
            where: {
                restaurantId: 'r1',
                status: 'AVAILABLE',
                capacity: { gte: 2 }
            },
            orderBy: { capacity: 'asc' }
        });
    });
  });

  describe('delete', () => {
    it('should delete a table', async () => {
        mockPrisma.table.delete.mockResolvedValue({});
        await repository.delete('t1');
        expect(mockPrisma.table.delete).toHaveBeenCalled();
    });
  });
});
