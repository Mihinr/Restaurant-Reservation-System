import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId?: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Gets the current correlation ID from the request context.
 */
export function getCorrelationId(): string | undefined {
  return requestContext.getStore()?.correlationId;
}

/**
 * Gets the current request context.
 */
export function getContext(): RequestContext | undefined {
  return requestContext.getStore();
}
