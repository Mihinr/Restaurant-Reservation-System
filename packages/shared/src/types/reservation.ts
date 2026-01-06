export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'SEATED' | 'CANCELLED';

export interface Reservation {
  id: string;
  reservationNumber: string;
  userId: string;
  restaurantId: string;
  tableId?: string;
  partySize: number;
  reservationDate: Date;
  reservationTime: Date;
  durationMinutes: number;
  status: ReservationStatus;
  statusUpdatedAt: Date;
  customerName?: string;
  customerPhone?: string;
  specialRequests?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReservationDto {
  restaurantId: string;
  tableId?: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  customerName?: string;
  customerPhone?: string;
  specialRequests?: string;
}

export interface UpdateReservationDto {
  tableId?: string;
  reservationDate?: string;
  reservationTime?: string;
  partySize?: number;
  customerName?: string;
  customerPhone?: string;
  specialRequests?: string;
}

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  userId: string;
  partySize: number;
  phoneNumber: string;
  name: string;
  status: WaitlistStatus;
  position: number;
  estimatedWaitTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWaitlistEntryDto {
  restaurantId: string;
  partySize: number;
  phoneNumber: string;
  name: string;
}

