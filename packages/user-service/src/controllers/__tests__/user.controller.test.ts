import { UserController } from '../user.controller';
import { UserService } from '../../services/user.service';

jest.mock('../../services/user.service');
jest.mock('../../validators/user.validator', () => ({
    updateUserSchema: { parse: jest.fn((d) => d) }
}));

describe('UserController', () => {
    let controller: UserController;
    let mockService: jest.Mocked<UserService>;
    let req: any;
    let res: any;

    beforeEach(() => {
        mockService = new UserService({} as any) as jest.Mocked<UserService>;
        controller = new UserController(mockService);
        req = { user: { userId: 'u1' }, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    it('should get current user', async () => {
        mockService.getUserById.mockResolvedValue({ id: 'u1' } as any);
        await controller.getCurrentUser(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if user missing in getCurrentUser', async () => {
        req.user = undefined;
        await controller.getCurrentUser(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should update current user with all fields', async () => {
        req.body = { firstName: 'New', lastName: 'Name', phone: '+1234567890' };
        mockService.updateUser.mockResolvedValue({ id: 'u1', firstName: 'New' } as any);
        await controller.updateCurrentUser(req, res);
        expect(mockService.updateUser).toHaveBeenCalledWith('u1', { 
            firstName: 'New',
            lastName: 'Name',
            phone: '+1234567890'
        });
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if user missing in updateCurrentUser', async () => {
        req.user = undefined;
        await controller.updateCurrentUser(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should delete current user', async () => {
        await controller.deleteCurrentUser(req, res);
        expect(mockService.deleteUser).toHaveBeenCalledWith('u1');
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if user missing in deleteCurrentUser', async () => {
        req.user = undefined;
        await controller.deleteCurrentUser(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
