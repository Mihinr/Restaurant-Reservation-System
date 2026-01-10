import { Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../auth.middleware';
import { verifyAccessToken } from '../../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../../errors/AppError';

jest.mock('../../utils/jwt');

describe('auth middleware', () => {
    let req: Partial<AuthRequest>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = { headers: {} };
        res = {};
        next = jest.fn();
    });

    describe('authenticate', () => {
        it('should authenticate with valid token', () => {
            req.headers!.authorization = 'Bearer valid-token';
            (verifyAccessToken as jest.Mock).mockReturnValue({ userId: 'u1', role: 'CUSTOMER' });
            authenticate(req as AuthRequest, res as Response, next);
            expect(req.user).toEqual({ userId: 'u1', role: 'CUSTOMER' });
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with UnauthorizedError if no header', () => {
            authenticate(req as AuthRequest, res as Response, next);
            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        });

        it('should call next with UnauthorizedError if invalid format', () => {
            req.headers!.authorization = 'Invalid format';
            authenticate(req as AuthRequest, res as Response, next);
            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        });

        it('should call next with UnauthorizedError if jwt verification fails', () => {
            req.headers!.authorization = 'Bearer invalid';
            (verifyAccessToken as jest.Mock).mockImplementation(() => { throw new Error(); });
            authenticate(req as AuthRequest, res as Response, next);
            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        });
    });

    describe('authorize', () => {
        it('should authorize if role matches', () => {
            req.user = { userId: 'u1', role: 'STAFF' } as any;
            authorize('STAFF', 'ADMIN')(req as AuthRequest, res as Response, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with UnauthorizedError if no user', () => {
            authorize('STAFF')(req as AuthRequest, res as Response, next);
            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        });

        it('should call next with ForbiddenError if role mismatch', () => {
            req.user = { userId: 'u1', role: 'CUSTOMER' } as any;
            authorize('STAFF')(req as AuthRequest, res as Response, next);
            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
        });
    });
});
