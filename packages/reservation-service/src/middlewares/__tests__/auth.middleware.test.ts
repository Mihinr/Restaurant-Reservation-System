import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, AuthRequest } from '../auth.middleware';
import { getEnvConfig } from '../../config/env';
import { UnauthorizedError, ForbiddenError } from '../../errors/AppError';

jest.mock('jsonwebtoken');
jest.mock('../../config/env');

describe('Auth Middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    (getEnvConfig as jest.Mock).mockReturnValue({ JWT_SECRET: 'secret' });
  });

  describe('authenticate', () => {
    it('should call next if token is valid', () => {
      req.headers!.authorization = 'Bearer valid-token';
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1', role: 'CUSTOMER' });

      authenticate(req as AuthRequest, res as Response, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with UnauthorizedError if no header', () => {
      authenticate(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next with UnauthorizedError if invalid header', () => {
      req.headers!.authorization = 'InvalidPrefix token';
      authenticate(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next with UnauthorizedError if JWT_SECRET is missing', () => {
        req.headers!.authorization = 'Bearer token';
        (getEnvConfig as jest.Mock).mockReturnValue({}); // No JWT_SECRET
        authenticate(req as AuthRequest, res as Response, next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle JsonWebTokenError', () => {
        req.headers!.authorization = 'Bearer token';
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new jwt.JsonWebTokenError('invalid');
        });
        authenticate(req as AuthRequest, res as Response, next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('authorize', () => {
    it('should allow if role matches', () => {
      req.user = { userId: '1', email: 'a@b.com', role: 'STAFF' as any };
      const middleware = authorize('STAFF' as any);
      middleware(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should forbid if role does not match', () => {
      req.user = { userId: '1', email: 'a@b.com', role: 'CUSTOMER' as any };
      const middleware = authorize('STAFF' as any);
      middleware(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});
