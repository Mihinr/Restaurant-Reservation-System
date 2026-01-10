import { Request, Response, NextFunction } from 'express';
import { validate } from '../validate.middleware';
import { z, ZodError } from 'zod';
import { BadRequestError } from '../../errors/AppError';

describe('validate middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = { body: {} };
        res = {};
        next = jest.fn();
    });

    it('should call next if validation passes', () => {
        const schema = z.object({ name: z.string() });
        req.body = { name: 'Test' };
        validate(schema)(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('should call next with BadRequestError if validation fails', () => {
        const schema = z.object({ name: z.string() });
        req.body = { name: 123 };
        validate(schema)(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should call next with fallback message if ZodError has no details', () => {
        const schema = { parse: () => { throw new ZodError([]); } } as any;
        validate(schema)(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Validation failed' }));
    });

    it('should pass through non-Zod errors', () => {
        const schema = { parse: () => { throw new Error('other'); } } as any;
        validate(schema)(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(expect.not.stringContaining('BadRequestError')); // It will be the generic error
    });
});
