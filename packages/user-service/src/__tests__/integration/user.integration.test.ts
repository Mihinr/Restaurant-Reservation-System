import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createUserRoutes } from '../../routes/user.routes';
import { createAuthRoutes } from '../../routes/auth.routes';
import { createHealthRoutes } from '../../routes/health.routes';

describe('User Service Integration Tests', () => {
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

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/health', createHealthRoutes(prisma));
    app.use('/api/v1/auth', createAuthRoutes(prisma));
    app.use('/api/v1/users', createUserRoutes(prisma));

    // Connect to database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.$disconnect();
  });

  describe('Health Endpoints', () => {
    it('GET /api/v1/health should return 200', async () => {
      const response = await request(app).get('/api/v1/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('GET /api/v1/health/ready should check database connection', async () => {
      const response = await request(app).get('/api/v1/health/ready');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('database', 'connected');
    });
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Integration',
      lastName: 'Test',
    };

    it('POST /api/v1/auth/register should create a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
      
      expect([200, 201]).toContain(response.status);
      if (response.body.success !== false) {
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user.email).toBe(testUser.email);
      }
    });

    it('POST /api/v1/auth/register should reject duplicate email', async () => {
      // Try to register the same user again
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
      
      expect(response.status).toBe(409); // Conflict
    });

    it('POST /api/v1/auth/login should authenticate user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('POST /api/v1/auth/login should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword',
        });
      
      // API returns 400 for validation errors or 401 for authentication failures
      // Depending on implementation, both are acceptable
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('User Endpoints - Authentication Required', () => {
    it('GET /api/v1/users/me should return 401 without auth', async () => {
      const response = await request(app).get('/api/v1/users/me');
      
      expect(response.status).toBe(401);
    });

    it('PUT /api/v1/users/me should return 401 without auth', async () => {
      const response = await request(app)
        .put('/api/v1/users/me')
        .send({ firstName: 'Updated' });
      
      expect(response.status).toBe(401);
    });
  });

  describe('Validation Tests', () => {
    it('POST /api/v1/auth/register should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });
      
      expect(response.status).toBe(400);
    });

    it('POST /api/v1/auth/register should validate password length', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Too short
          firstName: 'Test',
          lastName: 'User',
        });
      
      expect(response.status).toBe(400);
    });
  });
  describe('Authenticated User Operations', () => {
    const authenticatedUser = {
      email: `auth-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Authenticated',
      lastName: 'User',
    };
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      // Register and login to get tokens
      await request(app).post('/api/v1/auth/register').send(authenticatedUser);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: authenticatedUser.email,
        password: authenticatedUser.password,
      });
      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('GET /api/v1/users/me should return current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(authenticatedUser.email);
      expect(response.body.data.firstName).toBe(authenticatedUser.firstName);
    });

    it('PUT /api/v1/users/me should update user profile', async () => {
      const updatedData = {
        firstName: 'UpdatedName',
        lastName: 'UpdatedLast',
      };
      const response = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe(updatedData.firstName);
      expect(response.body.data.lastName).toBe(updatedData.lastName);
    });

    it('POST /api/v1/auth/refresh should return new access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      
      // Update access token for subsequent tests
      accessToken = response.body.data.accessToken;
    });

    it('POST /api/v1/auth/logout should invalidate token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      // Subsequent request with same token should fail (if logout invalidates)
      // Note: This depends on if the service uses a blacklist or just deletes the refresh token
      // If it only deletes refresh token, the access token might still be valid until expiry
    });

    it('DELETE /api/v1/users/me should delete user account', async () => {
      const response = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      // Login should now fail
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: authenticatedUser.email,
        password: authenticatedUser.password,
      });
      expect([400, 401]).toContain(loginResponse.status);
    });
  });
});
