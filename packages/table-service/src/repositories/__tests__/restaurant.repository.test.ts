import { PrismaClient } from '@prisma/client';
import { RestaurantRepository } from '../restaurant.repository';

describe('RestaurantRepository', () => {
  let repository: RestaurantRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      restaurant: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    repository = new RestaurantRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('constructor', () => {
    it('should throw error if prisma is missing', () => {
      expect(() => new RestaurantRepository(null as any)).toThrow('PrismaClient instance is required');
    });
  });

  describe('create', () => {
    it('should create a restaurant successfully', async () => {
      const data = {
        name: 'Test Restaurant',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '123-456-7890',
        email: 'test@example.com',
      };
      mockPrisma.restaurant.create.mockResolvedValue({ id: 'rest-1', ...data });

      const result = await repository.create(data);
      expect(mockPrisma.restaurant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Restaurant',
          city: 'New York',
        }),
      });
      expect(result.id).toBe('rest-1');
    });

    it('should use default values for opening/closing time', async () => {
        const data = {
          name: 'Test',
          address: 'Add',
          city: 'City',
          state: 'ST',
          zipCode: '123',
        };
        mockPrisma.restaurant.create.mockResolvedValue({ id: 'rest-1' });
        await repository.create(data);
        expect(mockPrisma.restaurant.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                timezone: 'America/New_York',
                openingTime: new Date('1970-01-01T11:00:00Z'),
                closingTime: new Date('1970-01-01T22:00:00Z')
            })
        });
    });

    it('should use explicit values for opening/closing time', async () => {
        const data = {
          name: 'Test',
          address: 'Add',
          city: 'City',
          state: 'ST',
          zipCode: '123',
          openingTime: '1970-01-01T10:00:00Z',
          closingTime: '1970-01-01T20:00:00Z',
        };
        mockPrisma.restaurant.create.mockResolvedValue({ id: 'rest-1' });
        await repository.create(data);
        expect(mockPrisma.restaurant.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                openingTime: new Date(data.openingTime),
                closingTime: new Date(data.closingTime)
            })
        });
    });
  });

  describe('findById', () => {
    it('should find a restaurant by id', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({ id: 'rest-1', name: 'Test' });
      const result = await repository.findById('rest-1');
      expect(result?.name).toBe('Test');
    });
  });

  describe('findByIds', () => {
    it('should return empty array if no ids provided', async () => {
      const result = await repository.findByIds([]);
      expect(result).toEqual([]);
      expect(mockPrisma.restaurant.findMany).not.toHaveBeenCalled();
    });

    it('should find restaurants by ids', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([{ id: 'rest-1' }]);
      await repository.findByIds(['rest-1']);
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should find all with filters', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([]);
      await repository.findAll({ city: 'NY', state: 'NY', isActive: true });
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith({
        where: { city: 'NY', state: 'NY', isActive: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('update', () => {
    it('should update a restaurant with all fields', async () => {
      mockPrisma.restaurant.update.mockResolvedValue({ id: 'rest-1', name: 'Updated' });
      const data = {
          name: 'New Name',
          address: 'New Addr',
          city: 'New City',
          state: 'NS',
          zipCode: '54321',
          email: 'new@email.com',
          timezone: 'UTC',
          openingTime: '10:00:00',
          closingTime: '18:00:00',
          phone: '999',
          isActive: false
      };
      await repository.update('rest-1', data);
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith({
          where: { id: 'rest-1' },
          data: expect.objectContaining({
              name: 'New Name',
              isActive: false,
              phone: '999',
              openingTime: expect.any(Date)
          })
      });
    });

    it('should handle null values for phone and email during update', async () => {
      mockPrisma.restaurant.update.mockResolvedValue({ id: 'rest-1' });
      await repository.update('rest-1', { phone: null as any, email: null as any });
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith({
          where: { id: 'rest-1' },
          data: expect.objectContaining({
              phone: null,
              email: null
          })
      });
    });
  });

  describe('delete', () => {
    it('should delete a restaurant', async () => {
      mockPrisma.restaurant.delete.mockResolvedValue({});
      await repository.delete('rest-1');
      expect(mockPrisma.restaurant.delete).toHaveBeenCalled();
    });
  });
});
