import { PrismaClient, Reservation, ReservationStatus } from '@prisma/client';
import { CreateReservationDto, UpdateReservationDto } from '@restaurant-reservation/shared';

export class ReservationRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    if (!prisma) {
      throw new Error('PrismaClient instance is required');
    }
    this.prisma = prisma;
  }

  async create(data: CreateReservationDto & { userId: string; reservationNumber: string }): Promise<Reservation> {
    const reservationDate = new Date(data.reservationDate);
    const [hours, minutes] = data.reservationTime.split(':').map(Number);
    const reservationTime = new Date();
    reservationTime.setHours(hours, minutes, 0, 0);

    return this.prisma.reservation.create({
      data: {
        reservationNumber: data.reservationNumber,
        userId: data.userId,
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        partySize: data.partySize,
        reservationDate,
        reservationTime,
        durationMinutes: 90,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        specialRequests: data.specialRequests,
        status: 'PENDING',
      },
    });
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.prisma.reservation.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: [{ reservationDate: 'desc' }, { reservationTime: 'desc' }],
    });
  }

  async findAll(): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      orderBy: [{ reservationDate: 'desc' }, { reservationTime: 'desc' }],
    });
  }

  async findByRestaurant(restaurantId: string): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: { restaurantId },
      orderBy: [{ reservationDate: 'asc' }, { reservationTime: 'asc' }],
    });
  }

  async findConflictingReservations(
    tableId: string,
    date: Date,
    time: Date,
    duration: number
  ): Promise<Reservation[]> {
    const endTime = new Date(time);
    endTime.setMinutes(endTime.getMinutes() + duration);

    return this.prisma.reservation.findMany({
      where: {
        tableId,
        reservationDate: date,
        status: {
          in: ['PENDING', 'CONFIRMED', 'SEATED'],
        },
        OR: [
          {
            reservationTime: {
              lte: time,
            },
            AND: {
              reservationTime: {
                gte: new Date(time.getTime() - duration * 60 * 1000),
              },
            },
          },
          {
            reservationTime: {
              gte: time,
              lt: endTime,
            },
          },
        ],
      },
    });
  }

  async update(id: string, data: UpdateReservationDto, expectedVersion?: number): Promise<Reservation> {
    const updateData: {
      tableId?: string;
      partySize?: number;
      reservationDate?: Date;
      reservationTime?: Date;
      customerName?: string;
      customerPhone?: string;
      specialRequests?: string;
      version?: { increment: number };
    } = {};

    if (data.tableId !== undefined) updateData.tableId = data.tableId;
    if (data.partySize !== undefined) updateData.partySize = data.partySize;
    if (data.reservationDate) {
      updateData.reservationDate = new Date(data.reservationDate);
    }
    if (data.reservationTime) {
      const [hours, minutes] = data.reservationTime.split(':').map(Number);
      const reservationTime = new Date();
      reservationTime.setHours(hours, minutes, 0, 0);
      updateData.reservationTime = reservationTime;
    }
    if (data.customerName !== undefined) updateData.customerName = data.customerName;
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
    if (data.specialRequests !== undefined) updateData.specialRequests = data.specialRequests;

    if (expectedVersion !== undefined) {
      updateData.version = { increment: 1 };
    }

    return this.prisma.reservation.update({
      where: {
        id,
        ...(expectedVersion !== undefined && { version: expectedVersion }),
      },
      data: updateData,
    });
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    return this.prisma.reservation.update({
      where: { id },
      data: {
        status,
        statusUpdatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        statusUpdatedAt: new Date(),
      },
    });
  }

  async findReservedTableIds(
    restaurantId: string,
    date: Date,
    time: Date,
    duration: number
  ): Promise<string[]> {
    const endTime = new Date(time);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        restaurantId,
        reservationDate: date,
        status: {
          in: ['PENDING', 'CONFIRMED', 'SEATED'],
        },
        tableId: {
          not: null,
        },
        OR: [
          {
            reservationTime: {
              lte: time,
            },
            AND: {
              reservationTime: {
                gte: new Date(time.getTime() - duration * 60 * 1000),
              },
            },
          },
          {
            reservationTime: {
              gte: time,
              lt: endTime,
            },
          },
        ],
      },
      select: {
        tableId: true,
      },
    });

    return reservations.map((r) => r.tableId!).filter((id): id is string => id !== null);
  }
}

