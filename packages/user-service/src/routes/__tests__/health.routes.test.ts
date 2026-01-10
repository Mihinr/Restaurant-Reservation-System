import request from 'supertest';
import express from 'express';
import { createHealthRoutes } from '../health.routes';

describe('Health Routes', () => {
    let app: express.Express;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }])
        };
        app = express();
        app.use('/health', createHealthRoutes(mockPrisma as any));
    });

    it('GET /health should return 200', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    it('GET /health/ready should return 200', async () => {
        const res = await request(app).get('/health/ready');
        expect(res.status).toBe(200);
    });

    it('GET /health/ready should return 503 if db down', async () => {
        mockPrisma.$queryRaw.mockRejectedValue(new Error('DB Down'));
        const res = await request(app).get('/health/ready');
        expect(res.status).toBe(503);
    });
});
