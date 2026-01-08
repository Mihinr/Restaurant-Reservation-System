import axios from 'axios';
import { Reservation, CreateReservationDto } from '@restaurant-reservation/shared';

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

reservationApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // 429 errors will be handled by individual thunks with user-friendly messages
    return Promise.reject(error);
  }
);

export const reservationService = {
  async getReservations(): Promise<{ data: Reservation[] }> {
    const response = await reservationApi.get<{ success: boolean; data: Reservation[] }>(
      '/api/v1/reservations'
    );
    return { data: response.data.data };
  },

  async createReservation(data: CreateReservationDto): Promise<{ data: Reservation }> {
    const response = await reservationApi.post<{ success: boolean; data: Reservation }>(
      '/api/v1/reservations',
      data
    );
    return { data: response.data.data };
  },

  async getReservationById(id: string): Promise<{ data: Reservation }> {
    const response = await reservationApi.get<{ success: boolean; data: Reservation }>(
      `/api/v1/reservations/${id}`
    );
    return { data: response.data.data };
  },

  async updateReservation(
    id: string,
    data: Partial<CreateReservationDto> & { version?: number }
  ): Promise<{ data: Reservation }> {
    const response = await reservationApi.put<{ success: boolean; data: Reservation }>(
      `/api/v1/reservations/${id}`,
      data
    );
    return { data: response.data.data };
  },

  async cancelReservation(id: string): Promise<void> {
    await reservationApi.delete(`/api/v1/reservations/${id}`);
  },
};

