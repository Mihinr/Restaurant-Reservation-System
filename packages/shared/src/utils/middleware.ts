import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requestContext } from './context';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Middleware to handle request correlation IDs.
 * Generates a new ID if not present and sets it in the request context and response headers.
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.header(CORRELATION_ID_HEADER) || uuidv4()) as string;

  // Set correlation ID in response headers for traceability
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  // Run the rest of the request within the context
  requestContext.run({ correlationId }, () => {
    next();
  });
}
