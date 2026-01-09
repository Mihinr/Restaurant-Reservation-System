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

    // Get tableIds from either tableIds array or legacy tableId field
    const tableIds = data.tableIds || (data.tableId ? [data.tableId] : []);

    if (tableIds.length > 0) {
      // Check for conflicting reservations (active ones only)
      const reservationDate = new Date(data.reservationDate);
      const timeParts = data.reservationTime.split(':').map(Number);
      const hours = timeParts[0] ?? 0;
      const minutes = timeParts[1] ?? 0;
      const reservationTime = new Date();
      reservationTime.setHours(hours, minutes, 0, 0);
      
      const conflicting = await this.reservationRepository.findConflictingReservations(
        tableIds,
        reservationDate,
        reservationTime,
        90
      );

      if (conflicting.length > 0) {
        throw new ConflictError('One or more tables are already reserved for the selected date and time');
      }
    }

    const reservationNumber = generateReservationNumber();

    try {
      const reservation = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const repo = new ReservationRepository(tx as unknown as PrismaClient);
        
        // Before creating, check if there are cancelled reservations at these exact time slots
        // and delete them to free up the slots
        if (tableIds.length > 0) {
          const reservationDate = new Date(data.reservationDate);
          const timeParts = data.reservationTime.split(':').map(Number);
          const hours = timeParts[0] ?? 0;
          const minutes = timeParts[1] ?? 0;
          const reservationTime = new Date();
          reservationTime.setHours(hours, minutes, 0, 0);
          
          // Find any cancelled reservations at these exact time slots
          // Check both legacy tableId and new tables relation
          const cancelledReservations = await tx.reservation.findMany({
            where: {
              reservationDate: reservationDate,
              reservationTime: reservationTime,
              status: 'CANCELLED',
              OR: [
                { tableId: { in: tableIds } },
                {
                  tables: {
                    some: {
                      tableId: { in: tableIds },
                    },
                  },
                },
              ],
            },
            include: {
              tables: true,
            },
          });
          
          // Delete cancelled reservations that conflict with our tables
          for (const cancelledReservation of cancelledReservations) {
            const cancelledTableIds = [
              ...(cancelledReservation.tableId ? [cancelledReservation.tableId] : []),
              ...cancelledReservation.tables.map((rt: { tableId: string }) => rt.tableId),
            ];
            
            // If all tables in the cancelled reservation are in our tableIds, delete it
            if (cancelledTableIds.every(id => tableIds.includes(id))) {
              await tx.reservation.delete({
                where: { id: cancelledReservation.id },
              });
            }
          }
        }
        
        return repo.create({
          ...data,
          userId,
          reservationNumber,
        });
      });

      const enriched = await this.enrichReservationsWithExternalData([reservation]);
      if (!enriched[0]) {
        throw new Error('Failed to enrich reservation');
      }
      return enriched[0];
    } catch (error: unknown) {
      // Handle Prisma unique constraint errors (though we shouldn't hit this with the new schema)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        const prismaError = error as Prisma.PrismaClientKnownRequestError;
        const target = prismaError.meta?.target as string[] | undefined;
        if (target && target.includes('reservationNumber')) {
          throw new ConflictError('A reservation with this number already exists. Please try again.');
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
    if (!enriched[0]) {
      throw new NotFoundError('Reservation not found');
    }
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

    // Get tableIds from either tableIds array or legacy tableId field
    const tableIds: string[] = data.tableIds || (data.tableId ? [data.tableId] : []);

    const updated = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const repo = new ReservationRepository(tx as unknown as PrismaClient);

      // Check for conflicts if tables or time are being updated
      if (tableIds.length > 0 && (data.reservationDate || data.reservationTime)) {
        const reservationDate = data.reservationDate ? new Date(data.reservationDate) : existing.reservationDate;
        const reservationTime = data.reservationTime 
          ? (() => {
              const timeParts = data.reservationTime.split(':').map(Number);
              const hours = timeParts[0] ?? 0;
              const minutes = timeParts[1] ?? 0;
              const time = new Date();
              time.setHours(hours, minutes, 0, 0);
              return time;
            })()
          : existing.reservationTime;

        const conflicting = await repo.findConflictingReservations(
          tableIds,
          reservationDate,
          reservationTime,
          90
        );

        // Filter out the current reservation from conflicts
        const otherConflicts = conflicting.filter(c => c.id !== id);
        if (otherConflicts.length > 0) {
          throw new ConflictError('One or more tables are already reserved for the selected date and time');
        }
      }

      return repo.update(id, data, expectedVersion);
    });

    const enriched = await this.enrichReservationsWithExternalData([updated]);
    if (!enriched[0]) {
      throw new Error('Failed to enrich updated reservation');
    }
    return enriched[0];
  }

  async removeTableFromReservation(reservationId: string, tableId: string): Promise<ReservationType> {
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    // Get all table IDs for this reservation - need to query with tables relation
    const reservationWithTables = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { tables: true },
    });
    if (!reservationWithTables) {
      throw new NotFoundError('Reservation not found');
    }
    const tableIds = [
      ...(reservationWithTables.tableId ? [reservationWithTables.tableId] : []),
      ...reservationWithTables.tables.map((rt: { tableId: string }) => rt.tableId),
    ];

    if (!tableIds.includes(tableId)) {
      throw new NotFoundError('Table not found in this reservation');
    }

    // If this is the only table, don't allow removal (should cancel the reservation instead)
    if (tableIds.length === 1) {
      throw new BadRequestError('Cannot remove the only table from a reservation. Please cancel the reservation instead.');
    }

    const updated = await this.reservationRepository.removeTableFromReservation(reservationId, tableId);
    const enriched = await this.enrichReservationsWithExternalData([updated]);
    if (!enriched[0]) {
      throw new Error('Failed to enrich updated reservation');
    }
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
    const timeParts = time.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
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
      tables?: Array<{ tableId: string }>;
    }>
  ): Promise<ReservationType[]> {
    const { TABLE_SERVICE_URL } = getEnvConfig();
    
    // Collect unique IDs
    const uniqueRestaurantIds = [...new Set(reservations.map((r) => r.restaurantId))];
    
    // Collect table IDs from both legacy tableId and new tables relation
    const uniqueTableIds = new Set<string>();
    reservations.forEach((r) => {
      if (r.tableId) uniqueTableIds.add(r.tableId);
      if (r.tables) {
        r.tables.forEach(rt => uniqueTableIds.add(rt.tableId));
      }
    });
    
    // Batch fetch restaurants and tables in parallel
    let restaurantMap: Map<string, { name: string; city: string; state: string }>;
    let tableMap: Map<string, { tableNumber: string }>;
    
    try {
      [restaurantMap, tableMap] = await Promise.all([
        this.batchFetchRestaurants(TABLE_SERVICE_URL, uniqueRestaurantIds),
        this.batchFetchTables(TABLE_SERVICE_URL, Array.from(uniqueTableIds)),
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
      
      // Collect all table IDs for this reservation
      const tableIds: string[] = [];
      if (reservation.tableId) {
        tableIds.push(reservation.tableId);
      }
      if (reservation.tables) {
        reservation.tables.forEach(rt => {
          if (!tableIds.includes(rt.tableId)) {
            tableIds.push(rt.tableId);
          }
        });
      }
      
      // Add table numbers
      const tableNumbers: string[] = [];
      tableIds.forEach(tableId => {
        const table = tableMap.get(tableId);
        if (table) {
          tableNumbers.push(table.tableNumber);
        }
      });
      
      // Set tableIds and tableNumbers arrays - only set if arrays have items
      if (tableIds.length > 0) {
        baseReservation.tableIds = tableIds;
        baseReservation.tableNumbers = tableNumbers;
      }
      
      // Keep backward compatibility: set single tableId and tableNumber
      if (tableIds.length === 1) {
        baseReservation.tableId = tableIds[0]!;
        baseReservation.tableNumber = tableNumbers[0]!;
      } else if (tableIds.length > 1) {
        // Multiple tables: don't set single tableId/tableNumber - omit the property
        // Properties are already not set, so no action needed
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
    return {
      id: reservation.id,
      reservationNumber: reservation.reservationNumber,
      userId: reservation.userId,
      restaurantId: reservation.restaurantId,
      ...(reservation.tableId ? { tableId: reservation.tableId } : {}),
      partySize: reservation.partySize,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      durationMinutes: reservation.durationMinutes,
      status: reservation.status as ReservationType['status'],
      statusUpdatedAt: reservation.statusUpdatedAt,
      ...(reservation.customerName ? { customerName: reservation.customerName } : {}),
      ...(reservation.customerPhone ? { customerPhone: reservation.customerPhone } : {}),
      ...(reservation.specialRequests ? { specialRequests: reservation.specialRequests } : {}),
      version: reservation.version,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}

