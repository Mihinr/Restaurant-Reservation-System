import { Request, Response } from 'express';
import { errorHandler } from '../errorHandler';
import { AppError } from '../../errors/AppError';
import { ZodError } from 'zod';
import { logger } from '../../config/logger';

jest.mock('../../config/logger');

describe('errorHandler', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = { path: '/', method: 'GET' };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    it('should handle AppError', () => {
        const err = new AppError(401, 'Unauthorized');
        errorHandler(err, req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' });
    });

    it('should handle ZodError', () => {
        const err = new ZodError([]);
        errorHandler(err, req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation error' }));
    });

    it('should handle generic Error', () => {
        const err = new Error('Global crash');
        errorHandler(err, req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(logger.error).toHaveBeenCalled();
    });
});
