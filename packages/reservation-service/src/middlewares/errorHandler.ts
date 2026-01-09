import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../config/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    });
    return;
  }

  // Handle Prisma unique constraint errors
  if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
    // Unique constraint violation
    const prismaError = err as Prisma.PrismaClientKnownRequestError;
    const target = prismaError.meta?.target as string[] | undefined;
    let message = 'A record with this information already exists';
    
    if (target) {
      if (target.includes('table_id') && target.includes('reservation_date') && target.includes('reservation_time')) {
        message = 'This table is already reserved for the selected date and time';
      } else if (target.includes('reservationNumber')) {
        message = 'A reservation with this number already exists';
      }
    }
    
    res.status(409).json({
      success: false,
      error: message,
    });
    return;
  }
  
  // Handle other Prisma errors
  if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
    // Record not found
    res.status(404).json({
      success: false,
      error: 'Record not found',
    });
    return;
  }

  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

