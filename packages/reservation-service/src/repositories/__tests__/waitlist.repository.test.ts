import { PrismaClient } from '@prisma/client';
import { WaitlistRepository } from '../waitlist.repository';

describe('WaitlistRepository', () => {
  let repository: WaitlistRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      waitlistEntry: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    repository = new WaitlistRepository(mockPrisma as unknown as PrismaClient);
  });

  it('should create a waitlist entry', async () => {
    const data = {
      restaurantId: 'rest-1',
      userId: 'user-1',
      partySize: 2,
      phoneNumber: '123',
      name: 'Test',
      position: 1,
    };
    mockPrisma.waitlistEntry.create.mockResolvedValue(data);

    const result = await repository.create(data);
    expect(mockPrisma.waitlistEntry.create).toHaveBeenCalled();
    expect(result).toEqual(data);
  });

  it('should find by id', async () => {
      mockPrisma.waitlistEntry.findUnique.mockResolvedValue({ id: '1' });
      const result = await repository.findById('1');
      expect(result?.id).toBe('1');
  });

  it('should find by restaurant', async () => {
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([]);
      await repository.findByRestaurant('rest-1', 'WAITING');
      expect(mockPrisma.waitlistEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: { restaurantId: 'rest-1', status: 'WAITING' }
      }));
  });

  it('should get next position', async () => {
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue({ position: 5 });
      const pos = await repository.getNextPosition('rest-1');
      expect(pos).toBe(6);
  });

  it('should get next position as 1 if no entries', async () => {
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(null);
      const pos = await repository.getNextPosition('rest-1');
      expect(pos).toBe(1);
  });

  it('should update status', async () => {
      await repository.updateStatus('1', 'NOTIFIED');
      expect(mockPrisma.waitlistEntry.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { status: 'NOTIFIED' }
      });
  });

  it('should mark as cancelled on delete', async () => {
      await repository.delete('1');
      expect(mockPrisma.waitlistEntry.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { status: 'CANCELLED' }
      });
  });
});
