import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';

jest.mock('../../services/auth.service');
jest.mock('../../config/logger');

describe('AuthController', () => {
    let controller: AuthController;
    let mockService: jest.Mocked<AuthService>;
    let req: any;
    let res: any;

    beforeEach(() => {
        mockService = new AuthService({} as any) as jest.Mocked<AuthService>;
        controller = new AuthController(mockService);
        req = { body: {}, user: { userId: 'u1' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    it('should register user', async () => {
        req.body = { email: 't@t.com' };
        mockService.register.mockResolvedValue({ user: { id: 'u1' } } as any);
        await controller.register(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalled();
    });

    it('should handle registration error', async () => {
        req.body = { email: 't@t.com' };
        const error = new Error('Reg failed');
        mockService.register.mockRejectedValue(error);
        await expect(controller.register(req, res)).rejects.toThrow('Reg failed');
    });

    it('should login user', async () => {
        req.body = { email: 't@t.com', password: 'p' };
        mockService.login.mockResolvedValue({ accessToken: 'at' } as any);
        await controller.login(req, res);
        expect(res.json).toHaveBeenCalled();
    });

    it('should refresh token', async () => {
        req.body = { refreshToken: 'rt' };
        mockService.refreshToken.mockResolvedValue({ accessToken: 'new-at' } as any);
        await controller.refresh(req, res);
        expect(res.json).toHaveBeenCalled();
    });

    it('should logout user', async () => {
        await controller.logout(req, res);
        expect(mockService.logout).toHaveBeenCalledWith('u1');
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if user missing in logout', async () => {
        req.user = undefined;
        await controller.logout(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
