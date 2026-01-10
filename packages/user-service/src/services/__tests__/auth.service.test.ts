import { PrismaClient } from '@prisma/client';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import { SessionRepository } from '../../repositories/session.repository';
import * as jwt from '../../utils/jwt';
import { UnauthorizedError } from '../../errors/AppError';
import { hashPassword } from '../../utils/password';

jest.mock('../user.service');
jest.mock('../../repositories/session.repository');
jest.mock('../../utils/jwt');
jest.mock('../../utils/password');

describe('AuthService', () => {
    let service: AuthService;
    let mockUserService: jest.Mocked<UserService>;
    let mockSessionRepo: jest.Mocked<SessionRepository>;

    beforeEach(() => {
        service = new AuthService({} as PrismaClient);
        mockUserService = (service as any).userService;
        mockSessionRepo = (service as any).sessionRepository;
        jest.clearAllMocks();
    });

    const mockUser = { id: 'u1', email: 't@t.com', role: 'CUSTOMER' as const };

    describe('register', () => {
        it('should register and return tokens', async () => {
            mockUserService.createUser.mockResolvedValue(mockUser as any);
            (jwt.generateAccessToken as jest.Mock).mockReturnValue('access');
            (jwt.generateRefreshToken as jest.Mock).mockReturnValue('refresh');
            
            const result = await service.register({ email: 't@t.com', password: 'p', firstName: 'F', lastName: 'L', phone: '123', role: 'CUSTOMER' });
            expect(result.user.id).toBe('u1');
            expect(result.accessToken).toBe('access');
            expect(mockSessionRepo.create).toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should login and return tokens', async () => {
            mockUserService.verifyPassword.mockResolvedValue(mockUser as any);
            (jwt.generateAccessToken as jest.Mock).mockReturnValue('access');
            (jwt.generateRefreshToken as jest.Mock).mockReturnValue('refresh');
            
            const result = await service.login({ email: 't@t.com', password: 'p' });
            expect(result.user.id).toBe('u1');
            expect(mockSessionRepo.create).toHaveBeenCalled();
        });
    });

    describe('refreshToken', () => {
        it('should refresh access token', async () => {
            (jwt.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'u1', email: 't@t.com', role: 'CUSTOMER' });
            (hashPassword as jest.Mock).mockResolvedValue('hash');
            mockSessionRepo.findByTokenHash.mockResolvedValue({ userId: 'u1' } as any);
            (jwt.generateAccessToken as jest.Mock).mockReturnValue('new-access');
            
            const result = await service.refreshToken('refresh');
            expect(result.accessToken).toBe('new-access');
        });

        it('should throw UnauthorizedError if session mismatch', async () => {
            (jwt.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'u1' });
            mockSessionRepo.findByTokenHash.mockResolvedValue({ userId: 'u2' } as any);
            await expect(service.refreshToken('refresh')).rejects.toThrow(UnauthorizedError);
        });

        it('should throw UnauthorizedError if token invalid', async () => {
            (jwt.verifyRefreshToken as jest.Mock).mockImplementation(() => { throw new Error(); });
            await expect(service.refreshToken('refresh')).rejects.toThrow(UnauthorizedError);
        });
    });

    describe('logout', () => {
        it('should delete sessions', async () => {
            await service.logout('u1');
            expect(mockSessionRepo.deleteByUserId).toHaveBeenCalledWith('u1');
        });
    });
});
