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
        const error = new AppError(404, 'App error');
        errorHandler(error, req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'App error' });
    });

    it('should handle ZodError', () => {
        const error = new ZodError([{ path: ['field'], message: 'invalid', code: 'custom' }]);
        errorHandler(error, req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation error' }));
    });

    it('should handle generic Error', () => {
        const error = new Error('Generic error');
        errorHandler(error, req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Internal server error' });
        expect(logger.error).toHaveBeenCalled();
    });
});
