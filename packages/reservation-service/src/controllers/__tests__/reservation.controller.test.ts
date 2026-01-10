import { Request, Response } from 'express';
import { ReservationController } from '../reservation.controller';
import { ReservationService } from '../../services/reservation.service';

jest.mock('../../services/reservation.service');

describe('ReservationController', () => {
  let controller: ReservationController;
  let mockService: jest.Mocked<ReservationService>;
  let req: any;
  let res: Partial<Response>;

  beforeEach(() => {
    mockService = new ReservationService({} as any) as jest.Mocked<ReservationService>;
    controller = new ReservationController(mockService);
    req = { params: {}, body: {}, query: {}, user: { userId: 'user-1', role: 'CUSTOMER' } as any };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('create', () => {
    it('should return 401 if user not in req', async () => {
      delete req.user;
      await controller.create(req as any, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle tableId legacy correctly', async () => {
      req.body = { tableId: 't1', restaurantId: 'r1', reservationDate: '2026-01-20', reservationTime: '18:00', partySize: 2 };
      mockService.createReservation.mockResolvedValue({} as any);
      await controller.create(req as any, res as Response);
      expect(mockService.createReservation).toHaveBeenCalledWith('user-1', expect.objectContaining({ tableId: 't1' }));
    });

    it('should handle specialRequests correctly', async () => {
        req.body = { tableIds: ['t1'], specialRequests: 'Low salt', restaurantId: 'r1', reservationDate: '2026-01-20', reservationTime: '18:00', partySize: 2 };
        mockService.createReservation.mockResolvedValue({} as any);
        await controller.create(req as any, res as Response);
        expect(mockService.createReservation).toHaveBeenCalledWith('user-1', expect.objectContaining({ specialRequests: 'Low salt' }));
    });

    it('should handle rate limit error', async () => {
      mockService.createReservation.mockRejectedValue(new Error('Rate limit exceeded'));
      await controller.create(req as any, res as Response);
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should rethrow other errors', async () => {
        const err = new Error('other');
        mockService.createReservation.mockRejectedValue(err);
        await expect(controller.create(req as any, res as Response)).rejects.toThrow(err);
    });
  });

  describe('getById', () => {
    it('should return 400 if id missing', async () => {
      req.params = { id: '' };
      await controller.getById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle rate limit error', async () => {
        mockService.getReservationById.mockRejectedValue(new Error('Rate limit exceeded'));
        req.params = { id: 'some-id' };
        await controller.getById(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should rethrow non-rate-limit errors', async () => {
        const err = new Error('Not found');
        mockService.getReservationById.mockRejectedValue(err);
        req.params = { id: 'some-id' };
        await expect(controller.getById(req as Request, res as Response)).rejects.toThrow(err);
    });
  });

  describe('getByUser', () => {
    it('should return 401 if unauthorized', async () => {
      delete req.user;
      await controller.getByUser(req as any, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle rate limit error for STAFF', async () => {
        mockService.getAllReservations.mockRejectedValue(new Error('Rate limit exceeded'));
        req.user = { userId: 'u1', role: 'STAFF' } as any;
        await controller.getByUser(req as any, res as Response);
        expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should fetch user-specific reservations for CUSTOMER role', async () => {
        req.user = { userId: 'user-1', role: 'CUSTOMER' } as any;
        mockService.getReservationsByUser.mockResolvedValue([{} as any]);
        await controller.getByUser(req as any, res as Response);
        expect(mockService.getReservationsByUser).toHaveBeenCalledWith('user-1');
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{} as any] });
    });

    it('should rethrow non-rate-limit errors in getByUser', async () => {
        const err = new Error('Database error');
        mockService.getAllReservations.mockRejectedValue(err);
        req.user = { userId: 'u1', role: 'STAFF' } as any;
        await expect(controller.getByUser(req as any, res as Response)).rejects.toThrow(err);
    });
  });

  describe('update', () => {
    it('should return 400 if id missing', async () => {
        req.params = { id: '' };
        await controller.update(req as any, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should map all validated fields to DTO', async () => {
        req.params = { id: 'res-1' };
        req.body = {
            tableIds: ['t1'],
            reservationDate: '2026-01-21',
            reservationTime: '19:00',
            partySize: 5,
            customerName: 'New Name',
            customerPhone: '123',
            specialRequests: 'None',
            version: 1
        };
        mockService.updateReservation.mockResolvedValue({} as any);
        await controller.update(req as any, res as Response);
        expect(mockService.updateReservation).toHaveBeenCalledWith('res-1', expect.objectContaining({
            partySize: 5,
            customerName: 'New Name'
        }), 1);
    });

    it('should handle legacy tableId in update', async () => {
        req.params = { id: 'res-1' };
        req.body = { tableId: 't1' };
        mockService.updateReservation.mockResolvedValue({} as any);
        await controller.update(req as any, res as Response);
        expect(mockService.updateReservation).toHaveBeenCalledWith('res-1', expect.objectContaining({ tableId: 't1' }), undefined);
    });
  });

  describe('cancel', () => {
      it('should return 400 if id missing', async () => {
          req.params = { id: '' };
          await controller.cancel(req as any, res as Response);
          expect(res.status).toHaveBeenCalledWith(400);
      });
  });

  describe('getReservedTableIds', () => {
      it('should return 400 if restaurantId missing', async () => {
          req.params = { restaurantId: '' };
          await controller.getReservedTableIds(req as any, res as Response);
          expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should handle invalid duration', async () => {
          req.params = { restaurantId: 'r1' };
          req.query = { date: '2026-01-20', time: '18:00', duration: 'invalid' };
          await controller.getReservedTableIds(req as any, res as Response);
          expect(res.status).toHaveBeenCalledWith(400);
      });
  });

  describe('removeTable', () => {
      it('should return 400 if id missing', async () => {
          req.params = { id: '', tableId: 't1' };
          await controller.removeTable(req as any, res as Response);
          expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should return 400 if tableId missing', async () => {
          req.params = { id: 'r1', tableId: '' };
          await controller.removeTable(req as any, res as Response);
          expect(res.status).toHaveBeenCalledWith(400);
      });
  });
});
