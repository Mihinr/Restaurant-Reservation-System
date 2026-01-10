import { ReservationService } from '../reservation.service';
import { ReservationRepository } from '../../repositories/reservation.repository';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getIO } from '../../socket';
import { SocketEvents } from '@restaurant-reservation/shared';
import { ConflictError, NotFoundError } from '../../errors/AppError';

// Mock dependencies
jest.mock('../../repositories/reservation.repository');
jest.mock('@prisma/client');
jest.mock('axios');
jest.mock('../../socket');
jest.mock('../../config/env', () => ({
  getEnvConfig: jest.fn().mockReturnValue({
    TABLE_SERVICE_URL: 'http://table-service',
    JWT_SECRET: 'secret'
  }),
}));
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    error: jest.fn(),
  },
}));

const MockRepository = ReservationRepository as jest.MockedClass<typeof ReservationRepository>;
const mockAxios = axios as jest.Mocked<typeof axios>;
const mockGetIO = getIO as jest.Mock;

describe('ReservationService', () => {
  let service: ReservationService;
  let prisma: any;
  let mockEmit: jest.Mock;
  let mockRepoMethods: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEmit = jest.fn();
    mockGetIO.mockReturnValue({ emit: mockEmit });

    mockRepoMethods = {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findById: jest.fn(),
        findByUserId: jest.fn(),
        findAll: jest.fn(),
        findByRestaurant: jest.fn(),
        findConflictingReservations: jest.fn().mockResolvedValue([]),
        removeTableFromReservation: jest.fn(),
        findReservedTableIds: jest.fn(),
        updateStatus: jest.fn(),
    };

    MockRepository.mockImplementation(() => mockRepoMethods);

    prisma = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(async (callback) => await callback(prisma)),
      reservation: {
        findMany: jest.fn().mockResolvedValue([]),
        delete: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    service = new ReservationService(prisma as unknown as PrismaClient);
  });

  const mockDate = new Date('2026-01-20');
  const mockReservation = {
    id: 'res-1',
    restaurantId: 'rest-1',
    reservationDate: mockDate,
    reservationTime: mockDate,
    partySize: 4,
    version: 1,
    status: 'CONFIRMED',
    statusUpdatedAt: mockDate,
    createdAt: mockDate,
    updatedAt: mockDate,
    reservationNumber: 'R123',
    userId: 'u1',
    tables: [{ tableId: 'table-1' }]
  };

  describe('createReservation', () => {
    it('should create a reservation successfully', async () => {
      mockRepoMethods.create.mockResolvedValue(mockReservation);
      mockAxios.post.mockResolvedValue({ data: { success: true, data: [] } });

      const result = await service.createReservation('user-1', { 
          restaurantId: 'rest-1', tableIds: ['table-1'], partySize: 4, 
          reservationDate: '2026-01-20', reservationTime: '18:00' 
      } as any);
      
      expect(result.id).toBe('res-1');
      expect(mockEmit).toHaveBeenCalledWith(SocketEvents.RESERVATION_CREATED, expect.any(Object));
    });

    it('should delete cancelled reservations if they conflict', async () => {
        mockRepoMethods.create.mockResolvedValue(mockReservation);
        mockAxios.post.mockResolvedValue({ data: { success: true, data: [] } });
        
        prisma.reservation.findMany.mockResolvedValue([
            { id: 'cancelled-1', tableId: 'table-1', tables: [{ tableId: 'table-1' }] }
        ]);

        await service.createReservation('user-1', { 
            restaurantId: 'rest-1', tableIds: ['table-1'], partySize: 4, 
            reservationDate: '2026-01-20', reservationTime: '18:00' 
        } as any);
        
        expect(prisma.reservation.delete).toHaveBeenCalledWith({ where: { id: 'cancelled-1' } });
    });

    it('should handle Prisma P2002 Conflict', async () => {
        const error = new Error('conflict') as any;
        error.code = 'P2002';
        error.meta = { target: ['reservationNumber'] };
        prisma.$transaction.mockRejectedValue(error);

        await expect(service.createReservation('u-1', { 
             reservationDate: '2026-01-20', reservationTime: '18:00', tableIds: ['t1'], partySize: 2
        } as any)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateReservation', () => {
      it('should check conflicts for current tables if time changes', async () => {
          mockRepoMethods.findById.mockResolvedValue(mockReservation);
          mockRepoMethods.update.mockResolvedValue(mockReservation);
          mockAxios.post.mockResolvedValue({ data: { success: true, data: [] } });

          await service.updateReservation('res-1', { reservationTime: '20:00' });
          expect(mockRepoMethods.findConflictingReservations).toHaveBeenCalled();
      });

      it('should throw ConflictError if version mismatch', async () => {
          mockRepoMethods.findById.mockResolvedValue({ ...mockReservation, version: 1 });
          await expect(service.updateReservation('res-1', {}, 2)).rejects.toThrow(ConflictError);
      });
  });

  describe('enrichment errors', () => {
      it('should handle rate limit error in enrichment', async () => {
          mockRepoMethods.findAll.mockResolvedValue([mockReservation]);
          mockAxios.post.mockRejectedValue({
              isAxiosError: true,
              response: { status: 429, headers: { 'retry-after': '30' } }
          } as any);
          mockAxios.isAxiosError.mockReturnValue(true);

          await expect(service.getAllReservations()).rejects.toThrow('Rate limit exceeded');
      });

      it('should handle other axios errors gracefully by returning partial data', async () => {
          mockRepoMethods.findAll.mockResolvedValue([mockReservation]);
          mockAxios.post.mockRejectedValue({ isAxiosError: true, message: 'timeout' });
          mockAxios.isAxiosError.mockReturnValue(true);

          const result = await service.getAllReservations();
          expect(result[0]?.restaurantName).toBeUndefined();
      });

      it('should handle generic errors in enrichment', async () => {
          mockRepoMethods.findAll.mockResolvedValue([mockReservation]);
          mockAxios.post.mockRejectedValue(new Error('generic'));
          mockAxios.isAxiosError.mockReturnValue(false);

          const result = await service.getAllReservations();
          expect(result[0]?.restaurantName).toBeUndefined();
      });
  });

  describe('other methods for coverage', () => {
      it('should get reserved table ids', async () => {
          mockRepoMethods.findReservedTableIds.mockResolvedValue(['t1']);
          const result = await service.getReservedTableIds('r1', 'date', 'time', 60);
          expect(result).toEqual(['t1']);
      });

      it('should handle tableId in enrichment mapToReservationType', async () => {
          const res = { ...mockReservation, tableId: 't1', tables: [] };
          mockRepoMethods.findAll.mockResolvedValue([res]);
          mockAxios.post.mockResolvedValue({ data: { success: true, data: [] } });
          const result = await service.getAllReservations();
          expect(result[0]?.tableId).toBe('t1');
      });

      it('should log error if socket fails in cancel', async () => {
          mockRepoMethods.findById.mockResolvedValue(mockReservation);
          mockRepoMethods.updateStatus.mockResolvedValue(mockReservation);
          mockAxios.post.mockResolvedValue({ data: { success: true, data: [] } });
          mockGetIO.mockReturnValue({ emit: () => { throw new Error('socket'); } });

          await service.cancelReservation('res-1');
          const { logger } = require('../../config/logger');
          expect(logger.error).toHaveBeenCalled();
      });

      it('should get reservation by id', async () => {
          mockRepoMethods.findById.mockResolvedValue(mockReservation);
          mockAxios.post.mockResolvedValue({ data: { success: true, data: [] } });
          const result = await service.getReservationById('res-1');
          expect(result.id).toBe('res-1');
      });

      it('should throw NotFoundError if getReservationById find nothing', async () => {
          mockRepoMethods.findById.mockResolvedValue(null);
          await expect(service.getReservationById('none')).rejects.toThrow(NotFoundError);
      });

      it('should get reservations by user', async () => {
          mockRepoMethods.findByUserId.mockResolvedValue([mockReservation]);
          mockAxios.post.mockResolvedValue({ data: { success: true, data: [] } });
          const result = await service.getReservationsByUser('user-1');
          expect(result).toHaveLength(1);
      });

      it('should remove table from reservation', async () => {
          const resWithTables = { ...mockReservation, tables: [{ tableId: 't1' }, { tableId: 't2' }] };
          mockRepoMethods.findById.mockResolvedValue(resWithTables);
          prisma.reservation.findUnique.mockResolvedValue(resWithTables);
          mockRepoMethods.removeTableFromReservation.mockResolvedValue(mockReservation);
          mockAxios.post.mockResolvedValue({ data: { success: true, data: [] } });

          await service.removeTableFromReservation('res-1', 't1');
          expect(mockRepoMethods.removeTableFromReservation).toHaveBeenCalledWith('res-1', 't1');
      });

      it('should throw NotFoundError if removeTableFromReservation findUnique fails', async () => {
          mockRepoMethods.findById.mockResolvedValue(mockReservation);
          prisma.reservation.findUnique.mockResolvedValue(null);
          await expect(service.removeTableFromReservation('res-1', 't1')).rejects.toThrow(NotFoundError);
      });
  });
});
