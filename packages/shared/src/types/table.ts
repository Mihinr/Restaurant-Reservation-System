export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  timezone: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  minPartySize: number;
  status: TableStatus;
  statusUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableAvailability {
  tableId: string;
  tableNumber: string;
  capacity: number;
  minPartySize: number;
  available: boolean;
  score?: number;
}

export interface SearchCriteria {
  restaurantId?: string;
  date: string;
  time: string;
  partySize: number;
  city?: string;
  state?: string;
}

export interface CreateRestaurantDto {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  timezone?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface UpdateRestaurantDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  openingTime?: string;
  closingTime?: string;
  isActive?: boolean;
}

export interface CreateTableDto {
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  minPartySize?: number;
}

export interface UpdateTableDto {
  tableNumber?: string;
  capacity?: number;
  minPartySize?: number;
  status?: TableStatus;
}

