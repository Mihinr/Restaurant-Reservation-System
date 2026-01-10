import { Request, Response } from 'express';
import { WaitlistController } from '../waitlist.controller';
import { WaitlistService } from '../../services/waitlist.service';

jest.mock('../../services/waitlist.service');
jest.mock('../../validators/waitlist.validator', () => ({
    createWaitlistEntrySchema: {
        parse: jest.fn((data) => data)
    }
}));

describe('WaitlistController', () => {
    let controller: WaitlistController;
    let mockService: jest.Mocked<WaitlistService>;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        mockService = new WaitlistService({} as any) as jest.Mocked<WaitlistService>;
        controller = new WaitlistController(mockService);
        req = { params: {}, body: {}, user: { userId: 'user-1' } as any } as any;
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    it('should return 401 if user not in req for join', async () => {
        delete (req as any).user;
        await controller.join(req as any, res as Response);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should join waitlist', async () => {
        mockService.joinWaitlist.mockResolvedValue({ id: 'wait-1' } as any);
        await controller.join(req as any, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle restaurantId missing in getByRestaurant', async () => {
        req.params = { restaurantId: '' };
        await controller.getByRestaurant(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should get by restaurant', async () => {
        req.params = { restaurantId: 'rest-1' };
        mockService.getWaitlistByRestaurant.mockResolvedValue([]);
        await controller.getByRestaurant(req as Request, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if user not in req for getByUser', async () => {
        delete (req as any).user;
        await controller.getByUser(req as any, res as Response);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should get by user', async () => {
        mockService.getWaitlistByUser.mockResolvedValue([]);
        await controller.getByUser(req as any, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    describe('updateStatus', () => {
        it('should return 400 if id missing', async () => {
            req.params = { id: '' };
            await controller.updateStatus(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if invalid status', async () => {
            req.params = { id: 'wait-1' };
            req.body = { status: 'INVALID' };
            await controller.updateStatus(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should update status', async () => {
            req.params = { id: 'wait-1' };
            req.body = { status: 'NOTIFIED' };
            mockService.updateWaitlistStatus.mockResolvedValue({ id: 'wait-1' } as any);
            await controller.updateStatus(req as Request, res as Response);
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should return 400 if id missing', async () => {
            req.params = { id: '' };
            await controller.remove(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should remove from waitlist', async () => {
            req.params = { id: 'wait-1' };
            await controller.remove(req as Request, res as Response);
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('respondToNotification', () => {
        it('should return 401 if user not in req', async () => {
            delete (req as any).user;
            await controller.respondToNotification(req as any, res as Response);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if id missing', async () => {
            req.params = { id: '' };
            await controller.respondToNotification(req as any, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if action invalid', async () => {
            req.params = { id: 'wait-1' };
            req.body = { action: 'invalid' };
            await controller.respondToNotification(req as any, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if entry not found', async () => {
            req.params = { id: 'wait-1' };
            req.body = { action: 'accept' };
            mockService.getWaitlistEntryById.mockResolvedValue(null);
            await controller.respondToNotification(req as any, res as Response);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if responding to someone else\'s notification', async () => {
            req.params = { id: 'wait-1' };
            req.body = { action: 'accept' };
            mockService.getWaitlistEntryById.mockResolvedValue({ userId: 'other-user' } as any);
            await controller.respondToNotification(req as any, res as Response);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return 400 if entry status is not NOTIFIED', async () => {
            req.params = { id: 'wait-1' };
            req.body = { action: 'accept' };
            mockService.getWaitlistEntryById.mockResolvedValue({ userId: 'user-1', status: 'WAITING' } as any);
            await controller.respondToNotification(req as any, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should respond to notification (accept)', async () => {
            req.params = { id: 'wait-1' };
            req.body = { action: 'accept' };
            mockService.getWaitlistEntryById.mockResolvedValue({ userId: 'user-1', status: 'NOTIFIED' } as any);
            mockService.updateWaitlistStatus.mockResolvedValue({ id: 'wait-1' } as any);
            await controller.respondToNotification(req as any, res as Response);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(mockService.updateWaitlistStatus).toHaveBeenCalledWith('wait-1', 'SEATED');
        });

        it('should respond to notification (decline)', async () => {
            req.params = { id: 'wait-1' };
            req.body = { action: 'decline' };
            mockService.getWaitlistEntryById.mockResolvedValue({ userId: 'user-1', status: 'NOTIFIED' } as any);
            mockService.updateWaitlistStatus.mockResolvedValue({ id: 'wait-1' } as any);
            await controller.respondToNotification(req as any, res as Response);
            expect(res.json).toHaveBeenCalled();
            expect(mockService.updateWaitlistStatus).toHaveBeenCalledWith('wait-1', 'WAITING');
        });
    });
});
