import { PrismaClient, Prisma } from '@prisma/client';
import { ReservationRepository } from '../repositories/reservation.repository';
import {
  CreateReservationDto,
  UpdateReservationDto,
  Reservation as ReservationType,
} from '@restaurant-reservation/shared';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/AppError';
import { generateReservationNumber } from '../utils/reservationNumber';
import { getEnvConfig } from '../config/env';
import { logger } from '../config/logger';
import axios from 'axios';

export class ReservationService {
  private reservationRepository: ReservationRepository;

  constructor(private prisma: PrismaClient) {
    this.reservationRepository = new ReservationRepository(prisma);
  }

  async createReservation(userId: string, data: CreateReservationDto): Promise<ReservationType> {
    if (data.partySize < 1) {
      throw new BadRequestError('Party size must be at least 1');
    }

    if (data.tableId) {
      // Check for conflicting reservations (active ones only)
      const reservationDate = new Date(data.reservationDate);
      const [hours, minutes] = data.reservationTime.split(':').map(Number);
      const reservationTime = new Date();
      reservationTime.setHours(hours, minutes, 0, 0);
      
      const conflicting = await this.reservationRepository.findConflictingReservations(
        data.tableId,
        reservationDate,
        reservationTime,
        90
      );

      if (conflicting.length > 0) {
        throw new ConflictError('This table is already reserved for the selected date and time');
      }
    }

    const reservationNumber = generateReservationNumber();

    try {
      const reservation = await this.prisma.$transaction(async (tx) => {
        const repo = new ReservationRepository(tx as unknown as PrismaClient);
        return repo.create({
          ...data,
          userId,
          reservationNumber,
        });
      });

      const enriched = await this.enrichReservationsWithExternalData([reservation]);
      return enriched[0];
    } catch (error) {
      // Handle Prisma unique constraint errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[] | undefined;
          if (target && target.includes('table_id') && target.includes('reservation_date') && target.includes('reservation_time')) {
            throw new ConflictError('This table is already reserved for the selected date and time');
          }
          if (target && target.includes('reservationNumber')) {
            // This should be extremely rare, but handle it
            throw new ConflictError('A reservation with this number already exists. Please try again.');
          }
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  async getReservationById(id: string): Promise<ReservationType> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }
    const enriched = await this.enrichReservationsWithExternalData([reservation]);
    return enriched[0];
  }

  async getReservationsByUser(userId: string): Promise<ReservationType[]> {
    const reservations = await this.reservationRepository.findByUserId(userId);
    return await this.enrichReservationsWithExternalData(reservations);
  }

  async getAllReservations(): Promise<ReservationType[]> {
    const reservations = await this.reservationRepository.findAll();
    return await this.enrichReservationsWithExternalData(reservations);
  }

  async updateReservation(
    id: string,
    data: UpdateReservationDto,
    expectedVersion?: number
  ): Promise<ReservationType> {
    const existing = await this.reservationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Reservation not found');
    }

    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw new ConflictError('This reservation was modified by another user. Please refresh the page and try again.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const repo = new ReservationRepository(tx as unknown as PrismaClient);

      if (data.tableId && data.reservationDate && data.reservationTime) {
        const conflicting = await repo.findConflictingReservations(
          data.tableId,
          new Date(data.reservationDate),
          new Date(`2000-01-01T${data.reservationTime}:00`),
          90
        );

        if (conflicting.length > 0 && conflicting[0]?.id !== id) {
          throw new ConflictError('Table is already reserved for this time slot');
        }
      }

      return repo.update(id, data, expectedVersion);
    });

    const enriched = await this.enrichReservationsWithExternalData([updated]);
    return enriched[0];
  }

  async cancelReservation(id: string): Promise<void> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.status === 'CANCELLED') {
      throw new BadRequestError('Reservation is already cancelled');
    }

    await this.reservationRepository.delete(id);
  }

  async getReservedTableIds(
    restaurantId: string,
    date: string,
    time: string,
    duration: number = 90
  ): Promise<string[]> {
    const reservationDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    const reservationTime = new Date();
    reservationTime.setHours(hours, minutes, 0, 0);

    return this.reservationRepository.findReservedTableIds(
      restaurantId,
      reservationDate,
      reservationTime,
      duration
    );
  }

  private async enrichReservationsWithExternalData(
    reservations: Array<{
      id: string;
      reservationNumber: string;
      userId: string;
      restaurantId: string;
      tableId: string | null;
      partySize: number;
      reservationDate: Date;
      reservationTime: Date;
      durationMinutes: number;
      status: string;
      statusUpdatedAt: Date;
      customerName: string | null;
      customerPhone: string | null;
      specialRequests: string | null;
      version: number;
      createdAt: Date;
      updatedAt: Date;
    }>
  ): Promise<ReservationType[]> {
    const { TABLE_SERVICE_URL } = getEnvConfig();
    
    // Collect unique IDs
    const uniqueRestaurantIds = [...new Set(reservations.map((r) => r.restaurantId))];
    const uniqueTableIds = [...new Set(reservations.map((r) => r.tableId).filter((id): id is string => id !== null))];
    
    // Batch fetch restaurants and tables in parallel
    let restaurantMap: Map<string, { name: string; city: string; state: string }>;
    let tableMap: Map<string, { tableNumber: string }>;
    
    try {
      [restaurantMap, tableMap] = await Promise.all([
        this.batchFetchRestaurants(TABLE_SERVICE_URL, uniqueRestaurantIds),
        this.batchFetchTables(TABLE_SERVICE_URL, uniqueTableIds),
      ]);
    } catch (error) {
      // If rate limited, throw error to be handled by controller
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        throw error;
      }
      // For other errors (network failures, service unavailable, etc.), 
      // log the error and continue with empty maps (graceful degradation)
      logger.warn('Failed to enrich reservation data with external service', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      restaurantMap = new Map();
      tableMap = new Map();
    }
    
    // Map reservations with enriched data
    return reservations.map((reservation) => {
      const baseReservation = this.mapToReservationType(reservation);
      
      // Add restaurant details
      const restaurant = restaurantMap.get(reservation.restaurantId);
      if (restaurant) {
        baseReservation.restaurantName = restaurant.name;
        baseReservation.restaurantCity = restaurant.city;
        baseReservation.restaurantState = restaurant.state;
      }
      
      // Add table number
      if (reservation.tableId) {
        const table = tableMap.get(reservation.tableId);
        if (table) {
          baseReservation.tableNumber = table.tableNumber;
        }
      }
      
      return baseReservation;
    });
  }

  private async batchFetchRestaurants(
    tableServiceUrl: string,
    restaurantIds: string[]
  ): Promise<Map<string, { name: string; city: string; state: string }>> {
    const restaurantMap = new Map<string, { name: string; city: string; state: string }>();
    
    if (restaurantIds.length === 0) {
      return restaurantMap;
    }
    
    try {
      // Use batch endpoint - single request for all restaurants
      const response = await axios.post<{ 
        success: boolean; 
        data: Array<{ id: string; name: string; city: string; state: string }> 
      }>(
        `${tableServiceUrl}/api/v1/restaurants/batch`,
        { ids: restaurantIds },
        { timeout: 5000 }
      );
      
      if (response.data.success && response.data.data) {
        response.data.data.forEach((restaurant) => {
          restaurantMap.set(restaurant.id, {
            name: restaurant.name,
            city: restaurant.city,
            state: restaurant.state,
          });
        });
      }
    } catch (error: unknown) {
      // Handle rate limiting specifically
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || '15';
        throw new Error(
          `Rate limit exceeded when fetching restaurant details. Please try again in ${retryAfter} seconds.`
        );
      }
      
      // For network errors, timeouts, or service unavailable, log and return empty map
      // This allows the reservation to be created even if enrichment fails
      if (axios.isAxiosError(error)) {
        logger.warn('Failed to batch fetch restaurants', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          url: `${tableServiceUrl}/api/v1/restaurants/batch`,
        });
      } else {
        logger.warn('Failed to batch fetch restaurants', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    return restaurantMap;
  }

  private async batchFetchTables(
    tableServiceUrl: string,
    tableIds: string[]
  ): Promise<Map<string, { tableNumber: string }>> {
    const tableMap = new Map<string, { tableNumber: string }>();
    
    if (tableIds.length === 0) {
      return tableMap;
    }
    
    try {
      // Use batch endpoint - single request for all tables
      const response = await axios.post<{ 
        success: boolean; 
        data: Array<{ id: string; tableNumber: string }> 
      }>(
        `${tableServiceUrl}/api/v1/tables/batch`,
        { ids: tableIds },
        { timeout: 5000 }
      );
      
      if (response.data.success && response.data.data) {
        response.data.data.forEach((table) => {
          tableMap.set(table.id, {
            tableNumber: table.tableNumber,
          });
        });
      }
    } catch (error: unknown) {
      // Handle rate limiting specifically
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || '15';
        throw new Error(
          `Rate limit exceeded when fetching table details. Please try again in ${retryAfter} seconds.`
        );
      }
      
      // For network errors, timeouts, or service unavailable, log and return empty map
      // This allows the reservation to be created even if enrichment fails
      if (axios.isAxiosError(error)) {
        logger.warn('Failed to batch fetch tables', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          url: `${tableServiceUrl}/api/v1/tables/batch`,
        });
      } else {
        logger.warn('Failed to batch fetch tables', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    return tableMap;
  }

  private mapToReservationType(reservation: {
    id: string;
    reservationNumber: string;
    userId: string;
    restaurantId: string;
    tableId: string | null;
    partySize: number;
    reservationDate: Date;
    reservationTime: Date;
    durationMinutes: number;
    status: string;
    statusUpdatedAt: Date;
    customerName: string | null;
    customerPhone: string | null;
    specialRequests: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): ReservationType {
    const timeStr = reservation.reservationTime.toTimeString().substring(0, 5);
    return {
      id: reservation.id,
      reservationNumber: reservation.reservationNumber,
      userId: reservation.userId,
      restaurantId: reservation.restaurantId,
      tableId: reservation.tableId || undefined,
      partySize: reservation.partySize,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      durationMinutes: reservation.durationMinutes,
      status: reservation.status as ReservationType['status'],
      statusUpdatedAt: reservation.statusUpdatedAt,
      customerName: reservation.customerName || undefined,
      customerPhone: reservation.customerPhone || undefined,
      specialRequests: reservation.specialRequests || undefined,
      version: reservation.version,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}

