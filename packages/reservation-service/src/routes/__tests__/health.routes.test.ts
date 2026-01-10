import express from 'express';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createHealthRoutes } from '../health.routes';

describe('Health Routes', () => {
  let app: express.Express;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn(),
    };
    app = express();
    app.use('/health', createHealthRoutes(mockPrisma as unknown as PrismaClient));
  });

  it('should return 200 for /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should return 200 and ready status if database is connected', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.database).toBe('connected');
  });

  it('should return 503 and not ready status if database is disconnected', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB Error'));
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not ready');
    expect(res.body.database).toBe('disconnected');
  });
});
