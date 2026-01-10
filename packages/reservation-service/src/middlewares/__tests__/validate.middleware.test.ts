import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validate.middleware';
import { BadRequestError } from '../../errors/AppError';

describe('Validate Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const schema = z.object({
    name: z.string(),
    age: z.number()
  });

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = jest.fn();
  });

  it('should call next if data is valid', () => {
    req.body = { name: 'John', age: 30 };
    const middleware = validate(schema);
    middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with BadRequestError if data is invalid', () => {
    req.body = { name: 'John', age: 'thirty' };
    const middleware = validate(schema);
    middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('should format Zod errors correctly', () => {
      req.body = { age: 'not a number' };
      const middleware = validate(schema);
      middleware(req as Request, res as Response, next);
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('name');
      expect(error.message).toContain('age');
  });

  it('should handle non-Zod errors', () => {
    const error = new Error('Random error');
    const middleware = validate({ parse: () => { throw error; } } as any);
    middleware(req as any, res as any, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should handle Zod errors with empty paths', () => {
      req.body = "not an object";
      // Create a schema that fails with a custom error (some zod errors might not have paths)
      const middleware = validate(z.string().refine(() => false, "Custom error"));
      middleware(req as any, res as any, next);
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe("Custom error");
  });
});
