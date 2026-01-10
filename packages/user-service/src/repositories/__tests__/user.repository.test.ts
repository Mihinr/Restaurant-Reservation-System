import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../user.repository';

describe('UserRepository', () => {
    let repository: UserRepository;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            user: {
                create: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
            }
        };
        repository = new UserRepository(mockPrisma as unknown as PrismaClient);
    });

    describe('constructor', () => {
        it('should throw if prisma is missing', () => {
             expect(() => new UserRepository(null as any)).toThrow('PrismaClient instance is required');
        });
    });

    describe('create', () => {
        it('should create user', async () => {
            const data = { email: 't@t.com', firstName: 'F', lastName: 'L', passwordHash: 'hash', role: 'CUSTOMER' as const } as any;
            mockPrisma.user.create.mockResolvedValue({ id: 'u1', ...data });
            const result = await repository.create(data);
            expect(result.id).toBe('u1');
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ email: 't@t.com' })
            });
        });

        it('should use default values in create', async () => {
            const data = { email: 't@t.com', firstName: 'F', lastName: 'L', passwordHash: 'hash' } as any;
            mockPrisma.user.create.mockResolvedValue({ id: 'u1', ...data });
            await repository.create(data);
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ role: 'CUSTOMER', phone: null })
            });
        });
    });

    describe('findById', () => {
        it('should find user', async () => {
            mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1' });
            const result = await repository.findById('u1');
            expect(result?.id).toBe('u1');
        });
    });

    describe('findByEmail', () => {
        it('should find by email', async () => {
            mockPrisma.user.findFirst.mockResolvedValue({ email: 't@t.com' });
            const result = await repository.findByEmail('t@t.com');
            expect(result?.email).toBe('t@t.com');
        });
    });

    describe('update', () => {
        it('should update user with all fields', async () => {
            mockPrisma.user.update.mockResolvedValue({ id: 'u1', firstName: 'New' });
            await repository.update('u1', { firstName: 'F', lastName: 'L', phone: '999' });
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: expect.objectContaining({ firstName: 'F', lastName: 'L', phone: '999' })
            });
        });
        
        it('should handle null phone', async () => {
            mockPrisma.user.update.mockResolvedValue({ id: 'u1' });
            await repository.update('u1', { phone: null as any });
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: expect.objectContaining({ phone: null })
            });
        });
    });

    describe('softDelete', () => {
        it('should soft delete', async () => {
            mockPrisma.user.update.mockResolvedValue({ id: 'u1', deletedAt: new Date() });
            await repository.softDelete('u1');
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: expect.objectContaining({ deletedAt: expect.any(Date) })
            });
        });
    });

    describe('findByRole', () => {
        it('should find by role', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);
            await repository.findByRole('ADMIN');
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: { role: 'ADMIN', deletedAt: null }
            });
        });
    });
});
