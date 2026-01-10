import { AppError, NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError, ConflictError } from '../AppError';

describe('AppError classes', () => {
    it('AppError should set status code and message', () => {
        const error = new AppError(500, 'Internal error');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Internal error');
        expect(error.isOperational).toBe(true);
    });

    it('NotFoundError should set 404', () => {
        const error = new NotFoundError('User not found');
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('User not found');
    });

    it('BadRequestError should set 400', () => {
        const error = new BadRequestError('Bad input');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad input');
    });

    it('UnauthorizedError should set 401', () => {
        const error = new UnauthorizedError();
        expect(error.statusCode).toBe(401);
    });

    it('ForbiddenError should set 403', () => {
        const error = new ForbiddenError();
        expect(error.statusCode).toBe(403);
    });

    it('ConflictError should set 409', () => {
        const error = new ConflictError();
        expect(error.statusCode).toBe(409);
    });
});
