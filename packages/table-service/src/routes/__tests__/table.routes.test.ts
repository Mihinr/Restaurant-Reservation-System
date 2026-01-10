import express from 'express';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createTableRoutes } from '../table.routes';
import { TableController } from '../../controllers/table.controller';

jest.mock('../../controllers/table.controller');
jest.mock('../../middlewares/validate.middleware', () => ({
    validate: () => (_req: any, _res: any, next: any) => next()
}));

describe('Table Routes', () => {
    let app: express.Express;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {};
        app = express();
        app.use(express.json());
        app.use('/tables', createTableRoutes(mockPrisma as unknown as PrismaClient));
    });

    it('should hit create handler', async () => {
        const spy = jest.spyOn(TableController.prototype, 'create').mockImplementation(async (_req, res) => {
            res.status(201).json({ success: true });
        });
        await request(app).post('/tables').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit getBatch handler', async () => {
        const spy = jest.spyOn(TableController.prototype, 'getBatch').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).post('/tables/batch').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit getById handler', async () => {
        const spy = jest.spyOn(TableController.prototype, 'getById').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).get('/tables/t1');
        expect(spy).toHaveBeenCalled();
    });

    it('should hit update handler', async () => {
        const spy = jest.spyOn(TableController.prototype, 'update').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).put('/tables/t1').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit updateStatus handler', async () => {
        const spy = jest.spyOn(TableController.prototype, 'updateStatus').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).put('/tables/t1/status').send({});
        expect(spy).toHaveBeenCalled();
    });

    it('should hit delete handler', async () => {
        const spy = jest.spyOn(TableController.prototype, 'delete').mockImplementation(async (_req, res) => {
            res.json({ success: true });
        });
        await request(app).delete('/tables/t1');
        expect(spy).toHaveBeenCalled();
    });
});
