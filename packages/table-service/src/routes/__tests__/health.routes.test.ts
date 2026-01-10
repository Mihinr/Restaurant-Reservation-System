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

  it('should return 200 for root', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should return 200 for /ready when DB is up', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('connected');
  });

  it('should return 503 for /ready when DB is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Down'));
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.database).toBe('disconnected');
  });
});
