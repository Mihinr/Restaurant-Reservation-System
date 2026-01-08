import axios from 'axios';
import { WaitlistEntry, CreateWaitlistEntryDto } from '@restaurant-reservation/shared';

const RESERVATION_SERVICE_URL = import.meta.env.VITE_RESERVATION_SERVICE_URL || 'http://localhost:3002';

const reservationApi = axios.create({
  baseURL: RESERVATION_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

reservationApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const waitlistService = {
  async joinWaitlist(data: CreateWaitlistEntryDto): Promise<{ data: WaitlistEntry }> {
    const response = await reservationApi.post<{ success: boolean; data: WaitlistEntry }>(
      '/api/v1/waitlist',
      data
    );
    return { data: response.data.data };
  },

  async getWaitlistByRestaurant(restaurantId: string): Promise<{ data: WaitlistEntry[] }> {
    const response = await reservationApi.get<{ success: boolean; data: WaitlistEntry[] }>(
      `/api/v1/waitlist/restaurants/${restaurantId}`
    );
    return { data: response.data.data };
  },

  async updateWaitlistStatus(id: string, status: WaitlistEntry['status']): Promise<{ data: WaitlistEntry }> {
    const response = await reservationApi.put<{ success: boolean; data: WaitlistEntry }>(
      `/api/v1/waitlist/${id}/status`,
      { status }
    );
    return { data: response.data.data };
  },

  async removeFromWaitlist(id: string): Promise<void> {
    await reservationApi.delete(`/api/v1/waitlist/${id}`);
  },

  async getMyWaitlist(): Promise<{ data: WaitlistEntry[] }> {
    const response = await reservationApi.get<{ success: boolean; data: WaitlistEntry[] }>(
      '/api/v1/waitlist/me'
    );
    return { data: response.data.data };
  },

  async respondToNotification(id: string, action: 'accept' | 'decline'): Promise<{ data: WaitlistEntry }> {
    const response = await reservationApi.put<{ success: boolean; data: WaitlistEntry; message?: string }>(
      `/api/v1/waitlist/${id}/respond`,
      { action }
    );
    return { data: response.data.data };
  },
};

