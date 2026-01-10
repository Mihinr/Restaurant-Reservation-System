import request from 'supertest';
import express from 'express';
import { createUserRoutes } from '../user.routes';

jest.mock('../../controllers/user.controller', () => {
    return {
        UserController: jest.fn().mockImplementation(() => ({
            getCurrentUser: jest.fn().mockImplementation((_req, res) => { res.json({ success: true }); return Promise.resolve(); }),
            updateCurrentUser: jest.fn().mockImplementation((_req, res) => { res.json({ success: true }); return Promise.resolve(); }),
            deleteCurrentUser: jest.fn().mockImplementation((_req, res) => { res.json({ success: true }); return Promise.resolve(); }),
        }))
    };
});

jest.mock('../../middlewares/auth.middleware', () => ({
    authenticate: (req: any, _res: any, next: any) => { 
        req.user = { userId: 'u1' };
        next(); 
    }
}));

describe('User Routes', () => {
    let app: express.Express;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {};
        app = express();
        app.use(express.json());
        app.use('/users', createUserRoutes(mockPrisma as any));
        jest.clearAllMocks();
    });

    it('GET /users/me', async () => {
        const res = await request(app).get('/users/me');
        expect(res.status).toBe(200);
    });

    it('PUT /users/me', async () => {
        const res = await request(app).put('/users/me').send({ firstName: 'New' });
        expect(res.status).toBe(200);
    });

    it('DELETE /users/me', async () => {
        const res = await request(app).delete('/users/me');
        expect(res.status).toBe(200);
    });
});
