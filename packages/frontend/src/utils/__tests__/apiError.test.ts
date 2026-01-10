import { getErrorMessage } from '../apiError';
import { AxiosError, AxiosResponse } from 'axios';

describe('getErrorMessage', () => {
  it('should return data.message if present in AxiosError', () => {
    const error = new AxiosError('Error');
    error.response = {
      data: { message: 'Custom message' }
    } as AxiosResponse;
    expect(getErrorMessage(error)).toBe('Custom message');
  });

  it('should return data.error if present in AxiosError', () => {
    const error = new AxiosError('Error');
    error.response = {
      data: { error: 'Error field' }
    } as AxiosResponse;
    expect(getErrorMessage(error)).toBe('Error field');
  });

  it('should return status-specific messages if no custom message', () => {
    const error = new AxiosError('Error');
    error.response = { status: 400 } as AxiosResponse;
    expect(getErrorMessage(error)).toBe('Please check your input, some fields are missing or invalid.');
    
    error.response = { status: 401 } as AxiosResponse;
    expect(getErrorMessage(error)).toBe('You need to be logged in to perform this action.');

    error.response = { status: 500 } as AxiosResponse;
    expect(getErrorMessage(error)).toBe('Server error, please try again later.');
  });

  it('should return error.message for standard Error', () => {
    const error = new Error('Standard error');
    expect(getErrorMessage(error)).toBe('Standard error');
  });

  it('should return default message for unknown error types', () => {
    expect(getErrorMessage({})).toBe('Something went wrong. Please try again.');
  });
});
