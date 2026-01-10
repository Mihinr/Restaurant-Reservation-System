const JWT_SECRET = 'test-secret-at-least-thirty-two-characters-long';
process.env.JWT_SECRET = JWT_SECRET;
process.env.NODE_ENV = 'test';

import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { createApp } from '../../app';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

describe('Reservation Service Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  const JWT_SECRET = 'test-secret-at-least-thirty-two-characters-long';

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3002';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/restaurant_reservation';

    // Initialize Prisma with test database
    const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Create Express app using the actual createApp function
    app = createApp(prisma);

    // Connect to database
    await prisma.$connect();
    
    // Clear database before tests
    await prisma.reservationTable.deleteMany();
    await prisma.reservation.deleteMany();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.reservationTable.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.$disconnect();
  });

  const generateToken = (userId: string, role: string = 'CUSTOMER') => {
    return jwt.sign({ userId, email: 'test@example.com', role }, JWT_SECRET);
  };

  describe('Health Endpoints', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Reservation Lifecycle', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const restaurantId = '550e8400-e29b-41d4-a716-446655440001';
    const tableId = '550e8400-e29b-41d4-a716-446655440002';
    const token = generateToken(userId);
    let reservationId: string;

    beforeEach(() => {
      jest.clearAllMocks();
      // Default axios mock for enrichment
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          data: [
            { id: restaurantId, name: 'Test Restaurant', city: 'Test City', state: 'TS' },
            { id: tableId, tableNumber: 'A1' }
          ]
        }
      });
    });

    it('POST /api/v1/reservations should create a new reservation', async () => {
      const reservationData = {
        restaurantId,
        partySize: 4,
        reservationDate: '2026-01-20',
        reservationTime: '18:00',
        tableIds: [tableId],
        customerName: 'Test Customer',
        customerPhone: '+1234567890' // Valid phone format
      };

      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send(reservationData);

      if (response.status !== 201) {
        console.error('Create reservation failed:', response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.partySize).toBe(4);
      expect(response.body.data.restaurantName).toBe('Test Restaurant');
      
      reservationId = response.body.data.id;
    });

    it('GET /api/v1/reservations should return user reservations', async () => {
      const response = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].userId).toBe(userId);
    });

    it('GET /api/v1/reservations/:id should return reservation details', async () => {
      const response = await request(app)
        .get(`/api/v1/reservations/${reservationId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(reservationId);
    });

    it('PUT /api/v1/reservations/:id should update reservation', async () => {
      const updateData = {
        partySize: 6,
      };

      const response = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.partySize).toBe(6);
    });

    it('GET /api/v1/reservations/restaurants/:id/reserved-tables should return reserved tables', async () => {
      const response = await request(app)
        .get(`/api/v1/reservations/restaurants/${restaurantId}/reserved-tables`)
        .query({
          date: '2026-01-20',
          time: '18:00'
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain(tableId);
    });

    it('DELETE /api/v1/reservations/:id/tables/:tableId should remove a table from reservation', async () => {
      // First, add another table to the reservation so we can remove one
      // (The service often blocks removing the only table)
      const table2Id = '550e8400-e29b-41d4-a716-446655440003';
      await prisma.reservationTable.create({
        data: {
          reservationId,
          tableId: table2Id
        }
      });

      const response = await request(app)
        .delete(`/api/v1/reservations/${reservationId}/tables/${table2Id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify table is gone
      const tables = await prisma.reservationTable.findMany({
        where: { reservationId }
      });
      expect(tables.map(t => t.tableId)).not.toContain(table2Id);
    });

    it('DELETE /api/v1/reservations/:id should cancel reservation', async () => {
      const response = await request(app)
        .delete(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify status in DB
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId }
      });
      expect(reservation?.status).toBe('CANCELLED');
    });
  });
});
