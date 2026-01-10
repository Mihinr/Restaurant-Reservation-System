import express from 'express';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createRestaurantRoutes } from '../restaurant.routes';
import { RestaurantController } from '../../controllers/restaurant.controller';

jest.mock('../../controllers/restaurant.controller');
jest.mock('../../middlewares/validate.middleware', () => ({
    validate: () => (_req: any, _res: any, next: any) => next()
}));

describe('Restaurant Routes', () => {
    let app: express.Express;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {};
        app = express();
        app.use(express.json());
        app.use('/restaurants', createRestaurantRoutes(mockPrisma as unknown as PrismaClient));
    });

    it('should hit create handler', async () => {
        const spy = jest.spyOn(RestaurantController.prototype, 'create').mockImplementation(async (_req, res) => {
            res.status(201).json({ success: true });
        });
        await request(app).post('/restaurants').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit getAll handler', async () => {
        const spy = jest.spyOn(RestaurantController.prototype, 'getAll').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).get('/restaurants');
        expect(spy).toHaveBeenCalled();
    });

    it('should hit getBatch handler', async () => {
        const spy = jest.spyOn(RestaurantController.prototype, 'getBatch').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).post('/restaurants/batch').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit getById handler', async () => {
        const spy = jest.spyOn(RestaurantController.prototype, 'getById').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).get('/restaurants/r1');
        expect(spy).toHaveBeenCalled();
    });

    it('should hit update handler', async () => {
        const spy = jest.spyOn(RestaurantController.prototype, 'update').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).put('/restaurants/r1').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit delete handler', async () => {
        const spy = jest.spyOn(RestaurantController.prototype, 'delete').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).delete('/restaurants/r1');
        expect(spy).toHaveBeenCalled();
    });
});
