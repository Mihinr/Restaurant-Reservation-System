import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { createApp } from '../../app';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Table Service Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
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

    // Clear DB
    await prisma.table.deleteMany();
    await prisma.restaurant.deleteMany();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.table.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.$disconnect();
  });

  describe('Health Endpoints', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Table Operations', () => {
    let restaurantId: string;
    let table1Id: string;
    let table2Id: string;

    const openingTime = new Date('1970-01-01T08:00:00Z');
    const closingTime = new Date('1970-01-01T22:00:00Z');

    beforeAll(async () => {
      // Seed a restaurant
      const restaurant = await prisma.restaurant.create({
        data: {
          name: 'Test Kitchen',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          phone: '+1234567890',
          openingTime,
          closingTime,
        }
      });
      restaurantId = restaurant.id;

      // Seed tables
      const t1 = await prisma.table.create({
        data: {
          restaurantId,
          tableNumber: 'A1',
          capacity: 4,
          minPartySize: 2,
          status: 'AVAILABLE'
        }
      });
      table1Id = t1.id;

      const t2 = await prisma.table.create({
        data: {
          restaurantId,
          tableNumber: 'A2',
          capacity: 2,
          minPartySize: 1,
          status: 'AVAILABLE'
        }
      });
      table2Id = t2.id;
    });

    it('GET /api/v1/restaurants should return list including our restaurant', async () => {
      const response = await request(app).get('/api/v1/restaurants');
      expect(response.status).toBe(200);
      expect(response.body.data.some((r: any) => r.id === restaurantId)).toBe(true);
    });

    it('GET /api/v1/restaurants/:id/tables should return tables for our restaurant', async () => {
      const response = await request(app)
        .get(`/api/v1/restaurants/${restaurantId}/tables`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/v1/restaurants/:id/availability should return available tables', async () => {
      // Mock reservation service to say no tables are reserved
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: [] }
      });

      const response = await request(app)
        .get(`/api/v1/restaurants/${restaurantId}/availability`)
        .query({
          date: '2026-01-20',
          time: '18:00',
          partySize: 4,
          duration: 90,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.some((t: any) => t.tableId === table1Id && t.available === true)).toBe(true);
      // Table 2 (capacity 2) should NOT be available for party 4
      expect(response.body.data.some((t: any) => t.tableId === table2Id && t.available === true)).toBe(false);
    });

    it('GET /api/v1/restaurants/:id/availability should mark reserved tables as unavailable', async () => {
      // Mock reservation service to say table 1 is reserved
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: [table1Id] }
      });

      const response = await request(app)
        .get(`/api/v1/restaurants/${restaurantId}/availability`)
        .query({
          date: '2026-01-20',
          time: '18:00',
          partySize: 2, // Party 2 could fit in both tables
          duration: 90,
        });
      
      expect(response.status).toBe(200);
      const t1 = response.body.data.find((t: any) => t.tableId === table1Id);
      const t2 = response.body.data.find((t: any) => t.tableId === table2Id);
      expect(t1.available).toBe(false);
      expect(t2.available).toBe(true);
    });

    it('POST /api/v1/tables/batch should return multiple tables by ID', async () => {
      const response = await request(app)
        .post('/api/v1/tables/batch')
        .send({
          ids: [table1Id, table2Id],
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.some((t: any) => t.id === table1Id)).toBe(true);
      expect(response.body.data.some((t: any) => t.id === table2Id)).toBe(true);
    });
  });
});
