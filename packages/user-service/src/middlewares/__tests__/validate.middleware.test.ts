import { Request, Response } from 'express';
import { validate } from '../validate.middleware';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../../errors/AppError';

describe('validate middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = { body: {} };
        res = {};
        next = jest.fn();
    });

    it('should call next on success', () => {
        const schema = { parse: jest.fn() } as unknown as ZodSchema;
        validate(schema)(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('should call next with BadRequestError on ZodError', () => {
        const error = new ZodError([{ path: ['field'], message: 'invalid', code: 'custom' }]);
        const schema = { parse: jest.fn(() => { throw error; }) } as unknown as ZodSchema;
        validate(schema)(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should use fallback message for empty Zod error array', () => {
        const error = new ZodError([]);
        const schema = { parse: jest.fn(() => { throw error; }) } as unknown as ZodSchema;
        validate(schema)(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Validation failed' }));
    });

    it('should pass through non-Zod errors', () => {
        const error = new Error('Other error');
        const schema = { parse: jest.fn(() => { throw error; }) } as unknown as ZodSchema;
        validate(schema)(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(error);
    });
});
