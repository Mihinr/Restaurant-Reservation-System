import express from 'express';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createWaitlistRoutes } from '../waitlist.routes';
import { WaitlistController } from '../../controllers/waitlist.controller';

jest.mock('../../controllers/waitlist.controller');
jest.mock('../../middlewares/auth.middleware', () => ({
    authenticate: (req: any, _res: any, next: any) => {
        req.user = { userId: 'u1', role: 'CUSTOMER' };
        next();
    },
    authorize: () => (_req: any, _res: any, next: any) => next()
}));
jest.mock('../../middlewares/validate.middleware', () => ({
    validate: () => (_req: any, _res: any, next: any) => next()
}));

describe('Waitlist Routes', () => {
    let app: express.Express;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {};
        app = express();
        app.use(express.json());
        app.use('/waitlist', createWaitlistRoutes(mockPrisma as unknown as PrismaClient));
    });

    it('should hit join handler', async () => {
        const spy = jest.spyOn(WaitlistController.prototype, 'join').mockImplementation(async (_req, res) => {
            res.status(201).json({ success: true });
        });
        await request(app).post('/waitlist').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit getByUser handler', async () => {
        const spy = jest.spyOn(WaitlistController.prototype, 'getByUser').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).get('/waitlist/me');
        expect(spy).toHaveBeenCalled();
    });

    it('should hit getByRestaurant handler', async () => {
        const spy = jest.spyOn(WaitlistController.prototype, 'getByRestaurant').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).get('/waitlist/restaurants/r1');
        expect(spy).toHaveBeenCalled();
    });

    it('should hit updateStatus handler', async () => {
        const spy = jest.spyOn(WaitlistController.prototype, 'updateStatus').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).put('/waitlist/w1/status').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit respondToNotification handler', async () => {
        const spy = jest.spyOn(WaitlistController.prototype, 'respondToNotification').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).put('/waitlist/w1/respond').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit remove handler', async () => {
        const spy = jest.spyOn(WaitlistController.prototype, 'remove').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).delete('/waitlist/w1');
        expect(spy).toHaveBeenCalled();
    });
});
