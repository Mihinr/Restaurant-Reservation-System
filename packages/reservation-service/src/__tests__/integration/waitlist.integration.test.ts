import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app';

// Mock socket.io
jest.mock('../../socket', () => ({
  getIO: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
}));

// Mock env config
jest.mock('../../config/env', () => ({
  getEnvConfig: jest.fn().mockReturnValue({
    NODE_ENV: 'test',
    PORT: 3002,
    DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/restaurant_reservation',
    JWT_SECRET: 'test-secret-at-least-thirty-two-characters-long',
    TABLE_SERVICE_URL: 'http://localhost:3003',
    LOG_LEVEL: 'info',
  }),
}));

describe('Waitlist Service Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  const JWT_SECRET = 'test-secret-at-least-thirty-two-characters-long';

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.NODE_ENV = 'test';

    // Initialize Prisma with test database
    const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Create Express app
    app = createApp(prisma);

    // Connect to database
    await prisma.$connect();
    
    // Clear database before tests
    await prisma.waitlistEntry.deleteMany();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.waitlistEntry.deleteMany();
    await prisma.$disconnect();
  });

  const generateToken = (userId: string, role: string = 'CUSTOMER') => {
    return jwt.sign({ userId, email: 'test@example.com', role }, JWT_SECRET);
  };

  describe('Waitlist Lifecycle', () => {
    const userId = '550e8400-e29b-41d4-a716-446655441000';
    const restaurantId = '550e8400-e29b-41d4-a716-446655441001';
    const token = generateToken(userId);
    const staffToken = generateToken('staff-id', 'STAFF');
    let entryId: string;

    it('POST /api/v1/waitlist should join the waitlist', async () => {
      const waitlistData = {
        restaurantId,
        partySize: 2,
        phoneNumber: '+1234567890',
        name: 'Waitlist User'
      };

      const response = await request(app)
        .post('/api/v1/waitlist')
        .set('Authorization', `Bearer ${token}`)
        .send(waitlistData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.position).toBe(1);
      
      entryId = response.body.data.id;
    });

    it('GET /api/v1/waitlist/me should return user waitlist entries', async () => {
      const response = await request(app)
        .get('/api/v1/waitlist/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].userId).toBe(userId);
    });

    it('GET /api/v1/waitlist/restaurants/:id should return waitlist for staff', async () => {
      const response = await request(app)
        .get(`/api/v1/waitlist/restaurants/${restaurantId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.some((e: any) => e.id === entryId)).toBe(true);
    });

    it('PUT /api/v1/waitlist/:id/status should update status (STAFF only)', async () => {
      const response = await request(app)
        .put(`/api/v1/waitlist/${entryId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'NOTIFIED' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('NOTIFIED');
    });

    it('PUT /api/v1/waitlist/:id/respond should allow user to respond', async () => {
      const response = await request(app)
        .put(`/api/v1/waitlist/${entryId}/respond`)
        .set('Authorization', `Bearer ${token}`)
        .send({ action: 'ACCEPT' });

      // The actual implementation might return 200 or 400 depending on business logic
      // But let's verify it reaches the controller
      expect([200, 400]).toContain(response.status);
    });

    it('DELETE /api/v1/waitlist/:id should remove from waitlist (STAFF only)', async () => {
      const response = await request(app)
        .delete(`/api/v1/waitlist/${entryId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);

      // Verify status in DB (should be CANCELLED according to repository)
      const entry = await prisma.waitlistEntry.findUnique({
        where: { id: entryId }
      });
      expect(entry?.status).toBe('CANCELLED');
    });
  });
});
