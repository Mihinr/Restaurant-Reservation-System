import { PrismaClient } from '../node_modules/.prisma/reservation-service-client';
import { ReservationRepository } from '../repositories/reservation.repository';
import {
  CreateReservationDto,
  UpdateReservationDto,
  Reservation as ReservationType,
} from '@restaurant-reservation/shared';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/AppError';
import { generateReservationNumber } from '../utils/reservationNumber';

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
      const conflicting = await this.reservationRepository.findConflictingReservations(
        data.tableId,
        new Date(data.reservationDate),
        new Date(`2000-01-01T${data.reservationTime}:00`),
        90
      );

      if (conflicting.length > 0) {
        throw new ConflictError('Table is already reserved for this time slot');
      }
    }

    const reservationNumber = generateReservationNumber();

    const reservation = await this.prisma.$transaction(async (tx) => {
      const repo = new ReservationRepository(tx as unknown as PrismaClient);
      return repo.create({
        ...data,
        userId,
        reservationNumber,
      });
    });

    return this.mapToReservationType(reservation);
  }

  async getReservationById(id: string): Promise<ReservationType> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }
    return this.mapToReservationType(reservation);
  }

  async getReservationsByUser(userId: string): Promise<ReservationType[]> {
    const reservations = await this.reservationRepository.findByUserId(userId);
    return reservations.map(this.mapToReservationType);
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
      throw new ConflictError('Reservation was modified by another user');
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

    return this.mapToReservationType(updated);
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

