import { AxiosError } from 'axios';

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Check for message in response body first
    const data = error.response?.data;
    if (data && typeof data === 'object') {
       if ('message' in data && typeof data.message === 'string') return data.message;
       if ('error' in data && typeof data.error === 'string') return data.error;
    }

    // Map status codes to user-friendly messages if no specific message is returned
    switch (error.response?.status) {
      case 400:
        return 'Please check your input, some fields are missing or invalid.';
      case 401:
        return 'You need to be logged in to perform this action.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Requested resource not found.';
      case 500:
        return 'Server error, please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service unavailable, please try again later.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};
