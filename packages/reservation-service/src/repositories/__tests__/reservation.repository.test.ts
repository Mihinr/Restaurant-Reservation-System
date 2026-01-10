import { PrismaClient } from '@prisma/client';
import { ReservationRepository } from '../reservation.repository';

describe('ReservationRepository', () => {
  let repository: ReservationRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      reservation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      reservationTable: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };
    repository = new ReservationRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('constructor', () => {
      it('should throw error if prisma is missing', () => {
          expect(() => new ReservationRepository(null as any)).toThrow('PrismaClient instance is required');
      });
  });

  describe('create', () => {
      it('should create a reservation with single tableId (legacy)', async () => {
          const data = {
            restaurantId: 'rest-1',
            userId: 'user-1',
            reservationDate: '2026-01-20',
            reservationTime: '18:00',
            partySize: 2,
            customerName: 'Test',
            customerPhone: '123',
            tableId: 'table-1',
            reservationNumber: 'RES-123'
          };
          mockPrisma.reservation.create.mockResolvedValue({ id: 'res-1' });
          await repository.create(data as any);
          expect(mockPrisma.reservation.create).toHaveBeenCalledWith(expect.objectContaining({
              data: expect.objectContaining({ tableId: 'table-1' })
          }));
      });

      it('should create a reservation with tableIds', async () => {
        const data = {
          restaurantId: 'rest-1',
          userId: 'user-1',
          reservationDate: '2026-01-20',
          reservationTime: '18:00',
          partySize: 2,
          customerName: 'Test',
          customerPhone: '123',
          tableIds: ['table-1', 'table-2'],
          reservationNumber: 'RES-123'
        };
        mockPrisma.reservation.create.mockResolvedValue({ id: 'res-1' });

        const result = await repository.create(data as any);
        expect(mockPrisma.reservation.create).toHaveBeenCalled();
        expect(result.id).toBe('res-1');
      });
  });

  describe('update', () => {
      it('should update a reservation with all fields', async () => {
        const id = 'res-1';
        const data = { 
            partySize: 4, 
            tableIds: ['table-2'],
            reservationDate: '2026-01-21',
            reservationTime: '19:00',
            customerName: 'New Name',
            customerPhone: '999',
            specialRequests: 'None'
        };
        mockPrisma.reservation.update.mockResolvedValue({ id, ...data, version: 2 });

        await repository.update(id, data, 1);
        expect(mockPrisma.reservation.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                partySize: 4,
                customerName: 'New Name',
                specialRequests: 'None',
                version: { increment: 1 }
            })
        }));
        expect(mockPrisma.reservationTable.deleteMany).toHaveBeenCalled();
        expect(mockPrisma.reservationTable.createMany).toHaveBeenCalled();
      });

      it('should update complex fields selectively', async () => {
          const id = 'res-1';
          mockPrisma.reservation.update.mockResolvedValue({ id });
          await repository.update(id, { partySize: null } as any);
          expect(mockPrisma.reservation.update).toHaveBeenCalled();
      });

      it('should update a reservation via legacy tableId (set)', async () => {
          const id = 'res-1';
          const data = { tableId: 'table-3' };
          mockPrisma.reservation.update.mockResolvedValue({ id, tableId: 'table-3' });
          
          await repository.update(id, data);
          expect(mockPrisma.reservation.update).toHaveBeenCalledWith(expect.objectContaining({
              data: expect.objectContaining({ tableId: 'table-3' })
          }));
          expect(mockPrisma.reservationTable.create).toHaveBeenCalled();
      });

      it('should update a reservation via legacy tableId (unset)', async () => {
          const id = 'res-1';
          const data = { tableId: undefined };
          mockPrisma.reservation.update.mockResolvedValue({ id });
          await repository.update(id, data as any);
          expect(mockPrisma.reservationTable.deleteMany).not.toHaveBeenCalled();
      });
  });

  describe('removeTableFromReservation', () => {
      it('should throw if reservation missing', async () => {
          mockPrisma.reservation.findUnique.mockResolvedValue(null);
          await expect(repository.removeTableFromReservation('r1', 't1')).rejects.toThrow('Reservation not found');
      });

      it('should set tableId to null if NO tables left', async () => {
          mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'r1', tables: [] });
          mockPrisma.reservation.update.mockResolvedValue({});
          await repository.removeTableFromReservation('r1', 't1');
          expect(mockPrisma.reservation.update).toHaveBeenCalledWith(expect.objectContaining({ data: { tableId: null } }));
      });

      it('should set tableId to null if MULTIPLE tables left', async () => {
          mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'r1', tables: [{ tableId: 't2' }, { tableId: 't3' }] });
          mockPrisma.reservation.update.mockResolvedValue({});
          await repository.removeTableFromReservation('r1', 't1');
          expect(mockPrisma.reservation.update).toHaveBeenCalledWith(expect.objectContaining({ data: { tableId: null } }));
      });
  });

  describe('findReservedTableIds', () => {
      it('should find reserved table ids', async () => {
          mockPrisma.reservation.findMany.mockResolvedValue([
              { tableId: 't1', tables: [{ tableId: 't2' }] },
              { tableId: 't3', tables: [] }
          ]);
          const result = await repository.findReservedTableIds('rest-1', new Date(), new Date(), 90);
          expect(result).toContain('t1');
          expect(result).toContain('t2');
          expect(result).toContain('t3');
          expect(result.length).toBe(3);
      });
  });

  describe('general finders', () => {
      it('should find by id', async () => {
        mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'res-1' });
        const result = await repository.findById('res-1');
        expect(result?.id).toBe('res-1');
      });

      it('should find all', async () => {
          mockPrisma.reservation.findMany.mockResolvedValue([]);
          await repository.findAll();
          expect(mockPrisma.reservation.findMany).toHaveBeenCalled();
      });

      it('should find by restaurant', async () => {
          mockPrisma.reservation.findMany.mockResolvedValue([]);
          await repository.findByRestaurant('rest-1');
          expect(mockPrisma.reservation.findMany).toHaveBeenCalled();
      });

      it('should find conflicting reservations', async () => {
        mockPrisma.reservation.findMany.mockResolvedValue([]);
        await repository.findConflictingReservations(['table-1'], new Date(), new Date(), 90);
        expect(mockPrisma.reservation.findMany).toHaveBeenCalled();
      });

      it('should find by user', async () => {
          mockPrisma.reservation.findMany.mockResolvedValue([]);
          await repository.findByUserId('user-1');
          expect(mockPrisma.reservation.findMany).toHaveBeenCalled();
      });
  });

  describe('status updates', () => {
      it('should update status', async () => {
          mockPrisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'COMPLETED' });
          const result = await repository.updateStatus('res-1', 'COMPLETED');
          expect(result.status).toBe('COMPLETED');
      });

      it('should delete (cancel) a reservation', async () => {
          mockPrisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'CANCELLED' });
          await repository.delete('res-1');
          expect(mockPrisma.reservation.update).toHaveBeenCalled();
      });
  });
});
