import { WaitlistService } from '../waitlist.service';
import { WaitlistRepository } from '../../repositories/waitlist.repository';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../../socket';
import { NotFoundError } from '../../errors/AppError';

jest.mock('../../repositories/waitlist.repository');
jest.mock('../../socket');
jest.mock('../../config/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
    }
}));

const MockRepository = WaitlistRepository as jest.MockedClass<typeof WaitlistRepository>;
const mockGetIO = getIO as jest.Mock;

describe('WaitlistService', () => {
    let service: WaitlistService;
    let mockRepo: any;
    let mockEmit: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockEmit = jest.fn();
        mockGetIO.mockReturnValue({ emit: mockEmit });

        mockRepo = {
            getNextPosition: jest.fn(),
            create: jest.fn(),
            findByRestaurant: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn(),
            delete: jest.fn(),
        };
        MockRepository.mockImplementation(() => mockRepo);
        service = new WaitlistService({} as PrismaClient);
    });

    const mockEntry = {
        id: 'wait-1',
        restaurantId: 'rest-1',
        userId: 'user-1',
        partySize: 2,
        phoneNumber: '123',
        name: 'John',
        status: 'WAITING',
        position: 1,
        estimatedWaitTime: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    it('should join waitlist and handle socket error', async () => {
        mockRepo.getNextPosition.mockResolvedValue(1);
        mockRepo.create.mockResolvedValue(mockEntry);
        mockGetIO.mockReturnValue({ emit: () => { throw new Error('socket'); } });

        const result = await service.joinWaitlist('user-1', { restaurantId: 'rest-1' } as any);
        expect(result.id).toBe('wait-1');
        const { logger } = require('../../config/logger');
        expect(logger.error).toHaveBeenCalled();
    });

    it('should update status and handle socket error', async () => {
        mockRepo.findById.mockResolvedValue(mockEntry);
        mockRepo.updateStatus.mockResolvedValue(mockEntry);
        mockGetIO.mockReturnValue({ emit: () => { throw new Error('socket'); } });

        await service.updateWaitlistStatus('wait-1', 'NOTIFIED');
        const { logger } = require('../../config/logger');
        expect(logger.error).toHaveBeenCalled();
    });

    it('should remove from waitlist and handle socket error', async () => {
        mockRepo.findById.mockResolvedValue(mockEntry);
        mockGetIO.mockReturnValue({ emit: () => { throw new Error('socket'); } });

        await service.removeFromWaitlist('wait-1');
        const { logger } = require('../../config/logger');
        expect(logger.error).toHaveBeenCalled();
    });

    it('should return null if entry not found in getWaitlistEntryById', async () => {
        mockRepo.findById.mockResolvedValue(null);
        const result = await service.getWaitlistEntryById('none');
        expect(result).toBeNull();
    });

    it('should throw NotFoundError if updating non-existent entry', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(service.updateWaitlistStatus('none', 'SEATED')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if removing non-existent entry', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(service.removeFromWaitlist('none')).rejects.toThrow(NotFoundError);
    });
});
