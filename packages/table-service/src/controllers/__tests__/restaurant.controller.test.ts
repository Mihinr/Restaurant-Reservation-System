import { Request, Response } from 'express';
import { RestaurantController } from '../restaurant.controller';
import { RestaurantService } from '../../services/restaurant.service';

jest.mock('../../services/restaurant.service');
jest.mock('../../validators/restaurant.validator', () => ({
    createRestaurantSchema: { parse: jest.fn((d) => d) },
    updateRestaurantSchema: { parse: jest.fn((d) => d) },
}));

describe('RestaurantController', () => {
    let controller: RestaurantController;
    let mockService: jest.Mocked<RestaurantService>;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        mockService = new RestaurantService({} as any) as jest.Mocked<RestaurantService>;
        controller = new RestaurantController(mockService);
        req = { body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    it('should create restaurant', async () => {
        req.body = { name: 'Rest', phone: '123', email: 'e', openingTime: '9', closingTime: '17' };
        mockService.createRestaurant.mockResolvedValue({ id: 'r1' } as any);
        await controller.create(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(mockService.createRestaurant).toHaveBeenCalledWith(expect.objectContaining({ name: 'Rest' }));
    });

    it('should get by id', async () => {
        req.params = { id: 'r1' };
        mockService.getRestaurantById.mockResolvedValue({ id: 'r1' } as any);
        await controller.getById(req as Request, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if id missing in getById', async () => {
        req.params = { id: '' };
        await controller.getById(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should get all with filters', async () => {
        req.query = { city: 'NY', state: 'NY', isActive: 'true' };
        mockService.getRestaurants.mockResolvedValue([]);
        await controller.getAll(req as Request, res as Response);
        expect(mockService.getRestaurants).toHaveBeenCalledWith({ city: 'NY', state: 'NY', isActive: true });
    });

    it('should update restaurant with all fields', async () => {
        req.params = { id: 'r1' };
        req.body = { 
            name: 'New', 
            address: 'Addr', 
            city: 'City', 
            state: 'ST', 
            zipCode: '123', 
            phone: '555', 
            email: 'e@e.com', 
            timezone: 'UTC', 
            openingTime: '9', 
            closingTime: '17', 
            isActive: false 
        };
        mockService.updateRestaurant.mockResolvedValue({ id: 'r1' } as any);
        await controller.update(req as Request, res as Response);
        expect(mockService.updateRestaurant).toHaveBeenCalledWith('r1', expect.objectContaining({ name: 'New', isActive: false }));
    });

    it('should return 400 if id missing in update', async () => {
        req.params = { id: '' };
        await controller.update(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should delete restaurant', async () => {
        req.params = { id: 'r1' };
        mockService.deleteRestaurant.mockResolvedValue();
        await controller.delete(req as Request, res as Response);
        expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if id missing in delete', async () => {
        req.params = { id: '' };
        await controller.delete(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should get batch', async () => {
        req.body = { ids: ['r1', 'r2', ''] };
        mockService.getRestaurantsByIds.mockResolvedValue([]);
        await controller.getBatch(req as Request, res as Response);
        expect(mockService.getRestaurantsByIds).toHaveBeenCalledWith(['r1', 'r2']);
    });

    it('should handle non-array ids in getBatch', async () => {
        req.body = { ids: 'not-array' };
        mockService.getRestaurantsByIds.mockResolvedValue([]);
        await controller.getBatch(req as Request, res as Response);
        expect(mockService.getRestaurantsByIds).toHaveBeenCalledWith([]);
    });
});
