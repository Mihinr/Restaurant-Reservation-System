import request from 'supertest';
import express from 'express';
import { createAuthRoutes } from '../auth.routes';

jest.mock('../../controllers/auth.controller', () => {
    return {
        AuthController: jest.fn().mockImplementation(() => ({
            register: jest.fn().mockImplementation((_req, res) => { res.status(201).json({ success: true }); return Promise.resolve(); }),
            login: jest.fn().mockImplementation((_req, res) => { res.json({ success: true }); return Promise.resolve(); }),
            refresh: jest.fn().mockImplementation((_req, res) => { res.json({ success: true }); return Promise.resolve(); }),
            logout: jest.fn().mockImplementation((_req, res) => { res.json({ success: true }); return Promise.resolve(); }),
        }))
    };
});

jest.mock('../../middlewares/auth.middleware', () => ({
    authenticate: (req: any, _res: any, next: any) => { 
        req.user = { userId: 'u1' };
        next(); 
    }
}));

describe('Auth Routes', () => {
    let app: express.Express;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {};
        app = express();
        app.use(express.json());
        app.use('/auth', createAuthRoutes(mockPrisma as any));
        jest.clearAllMocks();
    });

    it('POST /auth/register', async () => {
        const res = await request(app).post('/auth/register').send({ email: 't@t.com', password: 'password123', firstName: 'F', lastName: 'L' });
        expect(res.status).toBe(201);
    });

    it('POST /auth/login', async () => {
        const res = await request(app).post('/auth/login').send({ email: 't@t.com', password: 'password123' });
        expect(res.status).toBe(200);
    });

    it('POST /auth/refresh', async () => {
        const res = await request(app).post('/auth/refresh').send({ refreshToken: 'token' });
        expect(res.status).toBe(200);
    });

    it('POST /auth/logout', async () => {
        const res = await request(app).post('/auth/logout');
        expect(res.status).toBe(200);
    });
});
