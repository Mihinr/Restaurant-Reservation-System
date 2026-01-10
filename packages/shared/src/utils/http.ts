import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios';
import axiosRetry, { IAxiosRetryConfig, isNetworkOrIdempotentRequestError, exponentialDelay } from 'axios-retry';
import { requestContext } from './context';
import { CORRELATION_ID_HEADER } from './middleware';

export interface HttpClientConfig extends AxiosRequestConfig {
  retryConfig?: IAxiosRetryConfig;
}

/**
 * Creates a centralized Axios instance with standardized retry logic and timeouts.
 * This implementation follows the resilience pattern for inter-service communication.
 */
export function createHttpClient(config: HttpClientConfig = {}): AxiosInstance {
  const { retryConfig, ...axiosConfig } = config;

  const envRetries = process.env.HTTP_RETRY_COUNT ? parseInt(process.env.HTTP_RETRY_COUNT, 10) : 3;
  const envTimeout = process.env.HTTP_TIMEOUT ? parseInt(process.env.HTTP_TIMEOUT, 10) : 5000;

  // Set default timeout if not provided (5 seconds for inter-service calls)
  const instance = axios.create({
    timeout: envTimeout,
    ...axiosConfig,
  });

  // Default retry configuration
  const defaultRetryConfig: IAxiosRetryConfig = {
    retries: envRetries,
    retryDelay: (retryCount) => {
      // Exponential backoff: 200ms, 400ms, 800ms...
      return exponentialDelay(retryCount);
    },
    retryCondition: (error) => {
      // 1. Check if it's a transient failure (network error or timeout)
      // 2. Or a server-side 5xx error (excluding 501 Not Implemented)
      // 3. Ensure we only retry idempotent requests (GET, PUT, DELETE, etc.)
      
      const isTransientError = isNetworkOrIdempotentRequestError(error) || 
                               (error.response ? error.response.status >= 500 && error.response.status !== 501 : false);
      
      const isIdempotent = ['get', 'put', 'delete', 'head', 'options'].includes(error.config?.method?.toLowerCase() || '');
      
      // If the request has an 'x-idempotency-key' header, we can also retry POST
      const hasIdempotencyKey = !!error.config?.headers?.['x-idempotency-key'];
      
      return isTransientError && (isIdempotent || hasIdempotencyKey);
    },
    // Ensure we log retries for observability
    onRetry: (retryCount, error, requestConfig) => {
      console.warn(`Retry attempt #${retryCount} for ${requestConfig.method?.toUpperCase()} ${requestConfig.url}. Error: ${error.message}`);
    },
    shouldResetTimeout: true, // Reset timeout for each retry
  };

  // Apply retry logic
  axiosRetry(instance, {
    ...defaultRetryConfig,
    ...retryConfig,
  });

  // Add logging and context propagation interceptors
  instance.interceptors.request.use(
    (config) => {
      // Automatic Correlation ID propagation
      const store = requestContext.getStore();
      if (store?.correlationId) {
        config.headers[CORRELATION_ID_HEADER] = store.correlationId;
      }
      
      // You could add correlation IDs here
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isAxiosError(error)) {
        // Standardize error logging for inter-service failures
        const status = error.response?.status;
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        
        if (!error.config?.['axios-retry']?.retryCount || error.config['axios-retry'].retryCount === error.config['axios-retry'].retries) {
          // Log final failure after all retries
          console.error(`Final inter-service request failure: ${method} ${url} - Status: ${status || 'NETWORK_ERROR'} - Message: ${error.message}`);
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Standard HTTP Client for internal service communication
 */
export const internalHttpClient = createHttpClient({
  // Default inter-service configurations can go here
});
