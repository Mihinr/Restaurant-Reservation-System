import express from 'express';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createReservationRoutes } from '../reservation.routes';
import { ReservationController } from '../../controllers/reservation.controller';

jest.mock('../../controllers/reservation.controller');
jest.mock('../../middlewares/auth.middleware', () => ({
    authenticate: (req: any, _res: any, next: any) => {
        req.user = { userId: 'u1', role: 'CUSTOMER' };
        next();
    }
}));
jest.mock('../../middlewares/validate.middleware', () => ({
    validate: () => (_req: any, _res: any, next: any) => next()
}));

describe('Reservation Routes', () => {
  let app: express.Express;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {};
    app = express();
    app.use(express.json());
    app.use('/reservations', createReservationRoutes(mockPrisma as unknown as PrismaClient));
  });

  it('should hit create handler', async () => {
    const spy = jest.spyOn(ReservationController.prototype, 'create').mockImplementation(async (_req, res) => {
        res.status(201).json({ success: true });
    });
    await request(app).post('/reservations').send({});
    expect(spy).toHaveBeenCalled();
  });

  it('should hit getByUser handler', async () => {
    const spy = jest.spyOn(ReservationController.prototype, 'getByUser').mockImplementation(async (_req, res) => {
        res.json({ success: true });
    });
    await request(app).get('/reservations');
    expect(spy).toHaveBeenCalled();
  });

  it('should hit getReservedTableIds handler', async () => {
    const spy = jest.spyOn(ReservationController.prototype, 'getReservedTableIds').mockImplementation(async (_req, res) => {
        res.json({ success: true });
    });
    await request(app).get('/reservations/restaurants/r1/reserved-tables');
    expect(spy).toHaveBeenCalled();
  });

  it('should hit getById handler', async () => {
    const spy = jest.spyOn(ReservationController.prototype, 'getById').mockImplementation(async (_req, res) => {
        res.json({ success: true });
    });
    await request(app).get('/reservations/res-1');
    expect(spy).toHaveBeenCalled();
  });

  it('should hit update handler', async () => {
    const spy = jest.spyOn(ReservationController.prototype, 'update').mockImplementation(async (_req, res) => {
        res.json({ success: true });
    });
    await request(app).put('/reservations/res-1').send({});
    expect(spy).toHaveBeenCalled();
  });

  it('should hit cancel handler', async () => {
    const spy = jest.spyOn(ReservationController.prototype, 'cancel').mockImplementation(async (_req, res) => {
        res.json({ success: true });
    });
    await request(app).delete('/reservations/res-1');
    expect(spy).toHaveBeenCalled();
  });

  it('should hit removeTable handler', async () => {
    const spy = jest.spyOn(ReservationController.prototype, 'removeTable').mockImplementation(async (_req, res) => {
        res.json({ success: true });
    });
    await request(app).delete('/reservations/res-1/tables/t1');
    expect(spy).toHaveBeenCalled();
  });
});
