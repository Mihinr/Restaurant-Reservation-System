import { PrismaClient } from '@prisma/client';
import { UserService } from '../user.service';
import { UserRepository } from '../../repositories/user.repository';
import { hashPassword, comparePassword } from '../../utils/password';
import { NotFoundError, ConflictError, BadRequestError } from '../../errors/AppError';

jest.mock('../../repositories/user.repository');
jest.mock('../../utils/password');

describe('UserService', () => {
    let service: UserService;
    let mockRepo: jest.Mocked<UserRepository>;

    beforeEach(() => {
        service = new UserService({} as PrismaClient);
        mockRepo = (service as any).userRepository;
    });

    const mockDate = new Date();
    const mockUser = {
        id: 'u1',
        email: 't@t.com',
        firstName: 'F',
        lastName: 'L',
        phone: '123',
        role: 'CUSTOMER',
        passwordHash: 'hash',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
    };

    describe('createUser', () => {
        it('should create user', async () => {
            mockRepo.findByEmail.mockResolvedValue(null);
            (hashPassword as jest.Mock).mockResolvedValue('hash');
            mockRepo.create.mockResolvedValue(mockUser as any);
            const result = await service.createUser({ email: 't@t.com', password: 'p', firstName: 'F', lastName: 'L' });
            expect(result.id).toBe('u1');
            expect(mockRepo.create).toHaveBeenCalled();
        });

        it('should include phone and role if provided in createUser', async () => {
            mockRepo.findByEmail.mockResolvedValue(null);
            mockRepo.create.mockResolvedValue(mockUser as any);
            await service.createUser({ email: 't@t.com', password: 'p', firstName: 'F', lastName: 'L', phone: '123', role: 'ADMIN' });
            expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                phone: '123',
                role: 'ADMIN'
            }));
        });

        it('should handle missing phone and present deletedAt in mapping', async () => {
            const userWithoutPhone = { ...mockUser, phone: null, deletedAt: new Date() };
            mockRepo.findById.mockResolvedValue(userWithoutPhone as any);
            const result = await service.getUserById('u1');
            expect(result.phone).toBeUndefined();
            expect(result.deletedAt).toBeDefined();
        });

        it('should throw ConflictError if email exists', async () => {
            mockRepo.findByEmail.mockResolvedValue(mockUser as any);
            await expect(service.createUser({ email: 't@t.com' } as any)).rejects.toThrow(ConflictError);
        });
    });

    describe('getUserById', () => {
        it('should get user', async () => {
            mockRepo.findById.mockResolvedValue(mockUser as any);
            const result = await service.getUserById('u1');
            expect(result.id).toBe('u1');
        });

        it('should throw NotFoundError if missing', async () => {
            mockRepo.findById.mockResolvedValue(null);
            await expect(service.getUserById('u1')).rejects.toThrow(NotFoundError);
        });
    });

    describe('getUserByEmail', () => {
        it('should get user by email', async () => {
            mockRepo.findByEmail.mockResolvedValue(mockUser as any);
            const result = await service.getUserByEmail('t@t.com');
            expect(result?.id).toBe('u1');
        });

        it('should return null if missing', async () => {
            mockRepo.findByEmail.mockResolvedValue(null);
            const result = await service.getUserByEmail('t@t.com');
            expect(result).toBeNull();
        });
    });

    describe('updateUser', () => {
        it('should update user', async () => {
            mockRepo.findById.mockResolvedValue(mockUser as any);
            mockRepo.update.mockResolvedValue({ ...mockUser, firstName: 'New' } as any);
            const result = await service.updateUser('u1', { firstName: 'New' });
            expect(result.firstName).toBe('New');
        });

        it('should throw NotFoundError if missing', async () => {
            mockRepo.findById.mockResolvedValue(null);
            await expect(service.updateUser('u1', {})).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteUser', () => {
        it('should delete user', async () => {
            mockRepo.findById.mockResolvedValue(mockUser as any);
            await service.deleteUser('u1');
            expect(mockRepo.softDelete).toHaveBeenCalledWith('u1');
        });

        it('should throw NotFoundError if missing', async () => {
            mockRepo.findById.mockResolvedValue(null);
            await expect(service.deleteUser('u1')).rejects.toThrow(NotFoundError);
        });
    });

    describe('verifyPassword', () => {
        it('should verify password', async () => {
            mockRepo.findByEmail.mockResolvedValue(mockUser as any);
            (comparePassword as jest.Mock).mockResolvedValue(true);
            const result = await service.verifyPassword('t@t.com', 'p');
            expect(result.id).toBe('u1');
        });

        it('should throw BadRequestError if user missing', async () => {
            mockRepo.findByEmail.mockResolvedValue(null);
            await expect(service.verifyPassword('t@t.com', 'p')).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError if password invalid', async () => {
            mockRepo.findByEmail.mockResolvedValue(mockUser as any);
            (comparePassword as jest.Mock).mockResolvedValue(false);
            await expect(service.verifyPassword('t@t.com', 'p')).rejects.toThrow(BadRequestError);
        });
    });
});
