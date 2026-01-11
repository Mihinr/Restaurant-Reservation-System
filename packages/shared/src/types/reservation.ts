export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'SEATED' | 'CANCELLED';

export interface Reservation {
  id: string;
  reservationNumber: string;
  userId: string;
  restaurantId: string;
  restaurantName?: string;
  restaurantCity?: string;
  restaurantState?: string;
  tableId?: string; // Deprecated: kept for backward compatibility
  tableNumber?: string; // Deprecated: kept for backward compatibility
  tableIds?: string[]; // New: array of table IDs
  tableNumbers?: string[]; // New: array of table numbers
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
  tableId?: string; // Deprecated: use tableIds instead
  tableIds?: string[]; // New: array of table IDs
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  customerName?: string;
  customerPhone?: string;
  specialRequests?: string;
}

export interface UpdateReservationDto {
  tableId?: string; // Deprecated: use tableIds instead
  tableIds?: string[]; // New: array of table IDs (replaces all tables)
  reservationDate?: string;
  reservationTime?: string;
  partySize?: number;
  customerName?: string;
  customerPhone?: string;
  specialRequests?: string;
  status?: ReservationStatus;
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
  reservationDate?: Date;
  reservationTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWaitlistEntryDto {
  restaurantId: string;
  partySize: number;
  phoneNumber: string;
  name: string;
  reservationDate?: string;
  reservationTime?: string;
}

