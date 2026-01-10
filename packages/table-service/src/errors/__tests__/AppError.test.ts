import { AppError, NotFoundError, BadRequestError, ConflictError } from '../AppError';

describe('AppError classes', () => {
    it('AppError should set statusCode and message', () => {
        const error = new AppError(418, "I'm a teapot");
        expect(error.statusCode).toBe(418);
        expect(error.message).toBe("I'm a teapot");
        expect(error.isOperational).toBe(true);
    });

    it('NotFoundError should default to 404', () => {
        const error = new NotFoundError();
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Resource not found');
    });

    it('NotFoundError should use custom message', () => {
        const error = new NotFoundError('Where is it?');
        expect(error.message).toBe('Where is it?');
    });

    it('BadRequestError should default to 400', () => {
        const error = new BadRequestError();
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad request');
    });

    it('BadRequestError should use custom message', () => {
        const error = new BadRequestError('Wrong parameters');
        expect(error.message).toBe('Wrong parameters');
    });

    it('ConflictError should default to 409', () => {
        const error = new ConflictError();
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Conflict');
    });

    it('ConflictError should use custom message', () => {
        const error = new ConflictError('Already exists');
        expect(error.message).toBe('Already exists');
    });
});
