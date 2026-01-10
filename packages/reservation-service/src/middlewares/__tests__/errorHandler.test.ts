import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../errorHandler';
import { AppError } from '../../errors/AppError';
import { ZodError } from 'zod';
import { logger } from '../../config/logger';

jest.mock('../../config/logger');

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { path: '/test', method: 'GET' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should handle AppError', () => {
    const error = new AppError(400, 'App Error');
    errorHandler(error, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'App Error' });
  });

  it('should handle ZodError', () => {
    const error = new ZodError([]);
    errorHandler(error, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Validation error', 
      details: [] 
    });
  });

  it('should handle Prisma P2002 (Unique Constraint)', () => {
    const error = { code: 'P2002', message: 'match', meta: { target: ['reservationNumber'] } };
    errorHandler(error as any, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'A reservation with this number already exists' 
    });
  });

  it('should handle Prisma P2025 (Not Found)', () => {
    const error = { code: 'P2025' };
    errorHandler(error as any, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should handle other Prisma errors', () => {
      const error = { code: 'P9999' };
      errorHandler(error as any, req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should handle generic error', () => {
    const error = new Error('generic');
    errorHandler(error, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(logger.error).toHaveBeenCalled();
  });
});
