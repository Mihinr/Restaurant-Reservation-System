import { AxiosError } from 'axios';

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    // Prioritize our own friendly messages for these specific statuses
    // to ensure customers get actionable "what to do" advice.
    switch (status) {
      case 401:
        return 'Your session has expired or you are not logged in. Please log in again to continue.';
      case 429:
        return 'Too many requests. Please wait a minute before trying again.';
      case 502:
      case 503:
      case 504:
        return 'We are having trouble connecting to the service. Please check your internet or try again later.';
    }

    // Otherwise, check for specific message in response body (e.g. "Table already booked")
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      if ('message' in data && typeof data.message === 'string') return data.message;
      if ('error' in data && typeof data.error === 'string') return data.error;
    }

    // General status code mapping for everything else
    switch (status) {
      case 400:
        return 'Selection or input is invalid. Please double-check your entries and try again.';
      case 403:
        return 'You do not have permission to perform this action. Request denied.';
      case 404:
        return 'The requested information could not be found. It may have been moved or deleted.';
      case 500:
        return 'Our server is having a temporary issue. Please try again in a few minutes.';
    }

    // Fallback for network errors (no response)
    if (!error.response) {
      return 'Network error: Please check your internet connection and try again.';
    }
  }

  if (error instanceof Error) {
    // Avoid showing "Request failed with status code XXX" directly to the user
    if (error.message.includes('status code')) {
      return 'Something went wrong while processing your request. Please try again.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please refresh the page and try again.';
};
