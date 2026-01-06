import { api } from './api';
import { Reservation, CreateReservationDto } from '@restaurant-reservation/shared';

export const reservationService = {
  async getReservations(): Promise<{ data: Reservation[] }> {
    const response = await api.get<{ success: boolean; data: Reservation[] }>(
      '/api/v1/reservations'
    );
    return { data: response.data.data };
  },

  async createReservation(data: CreateReservationDto): Promise<{ data: Reservation }> {
    const response = await api.post<{ success: boolean; data: Reservation }>(
      '/api/v1/reservations',
      data
    );
    return { data: response.data.data };
  },

  async getReservationById(id: string): Promise<{ data: Reservation }> {
    const response = await api.get<{ success: boolean; data: Reservation }>(
      `/api/v1/reservations/${id}`
    );
    return { data: response.data.data };
  },

  async updateReservation(id: string, data: Partial<CreateReservationDto>): Promise<{ data: Reservation }> {
    const response = await api.put<{ success: boolean; data: Reservation }>(
      `/api/v1/reservations/${id}`,
      data
    );
    return { data: response.data.data };
  },

  async cancelReservation(id: string): Promise<void> {
    await api.delete(`/api/v1/reservations/${id}`);
  },
};

