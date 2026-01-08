export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

// Role constants for type-safe comparisons
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
} as const;

// Helper function to check if user has staff or admin role
export function isStaffOrAdmin(role: UserRole): boolean {
  return role === USER_ROLES.STAFF || role === USER_ROLES.ADMIN;
}

// Helper function to check if user has admin role
export function isAdmin(role: UserRole): boolean {
  return role === USER_ROLES.ADMIN;
}

// Helper function to check if user has staff role
export function isStaff(role: UserRole): boolean {
  return role === USER_ROLES.STAFF;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

