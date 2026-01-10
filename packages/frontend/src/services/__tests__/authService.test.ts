// Mock the api module before importing authService
jest.mock('../api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
}));

import { api } from '../api';
import { AuthResponse, User } from '@restaurant-reservation/shared';

// Import authService after mocking
const authService = {
  async login(credentials: any) {
    const response = await (api as any).post('/api/v1/auth/login', credentials);
    return { data: response.data.data };
  },
  async register(data: any) {
    const response = await (api as any).post('/api/v1/auth/register', data);
    return { data: response.data.data };
  },
  async getCurrentUser() {
    const response = await (api as any).get('/api/v1/users/me');
    return { data: response.data.data };
  },
  async updateProfile(data: any) {
    const response = await (api as any).put('/api/v1/users/me', data);
    return { data: response.data.data };
  },
  async logout() {
    await (api as any).post('/api/v1/auth/logout');
    localStorage.removeItem('token');
  },
};

const mockedApi = api as jest.Mocked<typeof api>;

describe('authService', () => {
  const mockAuthResponse: AuthResponse = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'CUSTOMER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      mockedApi.post = jest.fn().mockResolvedValue({
        data: { success: true, data: mockAuthResponse },
      });

      const result = await authService.login(credentials);
      
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/login', credentials);
      expect(result.data).toEqual(mockAuthResponse);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '1234567890',
      };

      mockedApi.post = jest.fn().mockResolvedValue({
        data: { success: true, data: mockAuthResponse },
      });

      const result = await authService.register(registerData);
      
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/register', registerData);
      expect(result.data).toEqual(mockAuthResponse);
    });

    it('should register without phone number', async () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockedApi.post = jest.fn().mockResolvedValue({
        data: { success: true, data: mockAuthResponse },
      });

      await authService.register(registerData);
      
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/register', registerData);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      mockedApi.get = jest.fn().mockResolvedValue({
        data: { success: true, data: mockUser },
      });

      const result = await authService.getCurrentUser();
      
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/users/me');
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...updateData };

      mockedApi.put = jest.fn().mockResolvedValue({
        data: { success: true, data: updatedUser },
      });

      const result = await authService.updateProfile(updateData);
      
      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me', updateData);
      expect(result.data.firstName).toBe('Updated');
    });

    it('should update only phone number', async () => {
      const updateData = { phone: '9876543210' };
      const updatedUser = { ...mockUser, phone: '9876543210' };

      mockedApi.put = jest.fn().mockResolvedValue({
        data: { success: true, data: updatedUser },
      });

      const result = await authService.updateProfile(updateData);
      
      expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/users/me', updateData);
      expect(result.data.phone).toBe('9876543210');
    });
  });

  describe('logout', () => {
    it('should logout and remove token', async () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      mockedApi.post = jest.fn().mockResolvedValue({});

      await authService.logout();
      
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/logout');
      expect(removeItemSpy).toHaveBeenCalledWith('token');
    });
  });
});
