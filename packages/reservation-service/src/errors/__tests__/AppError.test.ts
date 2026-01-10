import { 
  AppError, 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError, 
  ConflictError,
  ForbiddenError
} from '../AppError';

describe('AppError Classes', () => {
  it('should create an AppError with default isOperational', () => {
    const error = new AppError(500, 'Error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('should create an AppError with custom isOperational', () => {
      const error = new AppError(500, 'Error', false);
      expect(error.isOperational).toBe(false);
  });

  it('should create a BadRequestError with default message', () => {
    const error = new BadRequestError();
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad request');
  });

  it('should create an UnauthorizedError with default message', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  it('should create a NotFoundError with default message', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource not found');
  });

  it('should create a ConflictError with default message', () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Conflict');
  });

  it('should create a ForbiddenError with default message', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
  });
});
