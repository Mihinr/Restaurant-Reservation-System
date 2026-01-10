import { PrismaClient } from '@prisma/client';
import { SessionRepository } from '../session.repository';
import { hashPassword } from '../../utils/password';

jest.mock('../../utils/password');

describe('SessionRepository', () => {
    let repository: SessionRepository;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            userSession: {
                create: jest.fn(),
                findFirst: jest.fn(),
                deleteMany: jest.fn(),
                delete: jest.fn(),
            }
        };
        repository = new SessionRepository(mockPrisma as unknown as PrismaClient);
        (hashPassword as jest.Mock).mockResolvedValue('hashed-token');
    });

    it('should create session', async () => {
        const expires = new Date();
        mockPrisma.userSession.create.mockResolvedValue({ id: 's1' });
        const result = await repository.create('u1', 'token', expires);
        expect(result.id).toBe('s1');
        expect(hashPassword).toHaveBeenCalledWith('token');
        expect(mockPrisma.userSession.create).toHaveBeenCalledWith({
            data: { userId: 'u1', tokenHash: 'hashed-token', expiresAt: expires }
        });
    });

    it('should find by token hash', async () => {
        mockPrisma.userSession.findFirst.mockResolvedValue({ id: 's1' });
        const result = await repository.findByTokenHash('hashed');
        expect(result?.id).toBe('s1');
    });

    it('should delete by user id', async () => {
        await repository.deleteByUserId('u1');
        expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    });

    it('should delete by id', async () => {
        await repository.deleteById('s1');
        expect(mockPrisma.userSession.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });

    it('should delete expired', async () => {
        mockPrisma.userSession.deleteMany.mockResolvedValue({ count: 5 });
        const count = await repository.deleteExpired();
        expect(count).toBe(5);
        expect(mockPrisma.userSession.deleteMany).toHaveBeenCalled();
    });
});
