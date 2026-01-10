import { PrismaClient } from '@prisma/client';
import { RestaurantService } from '../restaurant.service';
import { RestaurantRepository } from '../../repositories/restaurant.repository';
import { NotFoundError } from '../../errors/AppError';

jest.mock('../../repositories/restaurant.repository');

describe('RestaurantService', () => {
    let service: RestaurantService;
    let mockRepo: jest.Mocked<RestaurantRepository>;
    let prisma: any;

    beforeEach(() => {
        jest.clearAllMocks();
        prisma = {} as PrismaClient;
        service = new RestaurantService(prisma);
        mockRepo = (service as any).restaurantRepository;
    });

    const mockDate = new Date();
    const mockRestData = {
        id: 'r1',
        name: 'Rest 1',
        address: 'Addr',
        city: 'City',
        state: 'ST',
        zipCode: '123',
        phone: '555',
        email: 'e@e.com',
        timezone: 'TZ',
        openingTime: new Date('1970-01-01T09:00:00'),
        closingTime: new Date('1970-01-01T17:00:00'),
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    it('should create a restaurant', async () => {
        mockRepo.create.mockResolvedValue(mockRestData);
        const result = await service.createRestaurant({} as any);
        expect(result.id).toBe('r1');
        expect(result.openingTime).toBe('09:00:00');
    });

    it('should get restaurant by id', async () => {
        mockRepo.findById.mockResolvedValue(mockRestData);
        const result = await service.getRestaurantById('r1');
        expect(result.name).toBe('Rest 1');
    });

    it('should throw NotFoundError if restaurant not found', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(service.getRestaurantById('none')).rejects.toThrow(NotFoundError);
    });

    it('should get restaurants with filters', async () => {
        mockRepo.findAll.mockResolvedValue([mockRestData]);
        const result = await service.getRestaurants({ city: 'City' });
        expect(result).toHaveLength(1);
        expect(mockRepo.findAll).toHaveBeenCalledWith({ city: 'City' });
    });

    it('should update restaurant', async () => {
        mockRepo.findById.mockResolvedValue(mockRestData);
        mockRepo.update.mockResolvedValue({ ...mockRestData, name: 'New' });
        const result = await service.updateRestaurant('r1', { name: 'New' });
        expect(result.name).toBe('New');
    });

    it('should throw NotFoundError on update if missing', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(service.updateRestaurant('r1', {})).rejects.toThrow(NotFoundError);
    });

    it('should delete restaurant', async () => {
        mockRepo.findById.mockResolvedValue(mockRestData);
        await service.deleteRestaurant('r1');
        expect(mockRepo.delete).toHaveBeenCalledWith('r1');
    });

    it('should throw NotFoundError on delete if missing', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(service.deleteRestaurant('r1')).rejects.toThrow(NotFoundError);
    });

    it('should get restaurants by ids', async () => {
        mockRepo.findByIds.mockResolvedValue([mockRestData]);
        const result = await service.getRestaurantsByIds(['r1']);
        expect(result).toHaveLength(1);
    });

    it('should return empty if no ids provided for getRestaurantsByIds', async () => {
        expect(await service.getRestaurantsByIds([])).toEqual([]);
    });

    it('should handle missing phone and email in mapping', async () => {
        const minimal = { ...mockRestData, phone: null, email: null };
        mockRepo.findById.mockResolvedValue(minimal);
        const result = await service.getRestaurantById('r1');
        expect(result.phone).toBeUndefined();
        expect(result.email).toBeUndefined();
    });
});
