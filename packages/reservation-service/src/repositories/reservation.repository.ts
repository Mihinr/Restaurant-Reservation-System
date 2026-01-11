import { PrismaClient, Prisma } from '@prisma/client';

type Reservation = Prisma.ReservationGetPayload<{}>;
type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
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
    const timeParts = data.reservationTime.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const reservationTime = new Date();
    reservationTime.setHours(hours, minutes, 0, 0);

    // Get tableIds from either tableIds array or legacy tableId field
    const tableIds = data.tableIds || (data.tableId ? [data.tableId] : []);

    return this.prisma.reservation.create({
      data: {
        reservationNumber: data.reservationNumber,
        userId: data.userId,
        restaurantId: data.restaurantId,
        tableId: tableIds.length === 1 ? tableIds[0]! : null, // Keep for backward compatibility
        partySize: data.partySize,
        reservationDate,
        reservationTime,
        durationMinutes: 90,
        customerName: data.customerName ?? null,
        customerPhone: data.customerPhone ?? null,
        specialRequests: data.specialRequests ?? null,
        status: 'CONFIRMED',
        tables: {
          create: tableIds.map(tableId => ({
            tableId: tableId,
          })),
        },
      },
      include: {
        tables: true,
      },
    });
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: {
        tables: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: {
        tables: true,
      },
      orderBy: [{ reservationDate: 'desc' }, { reservationTime: 'desc' }],
    });
  }

  async findAll(): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      include: {
        tables: true,
      },
      orderBy: [{ reservationDate: 'desc' }, { reservationTime: 'desc' }],
    });
  }

  async findByRestaurant(restaurantId: string): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: { restaurantId },
      include: {
        tables: true,
      },
      orderBy: [{ reservationDate: 'asc' }, { reservationTime: 'asc' }],
    });
  }

  async findConflictingReservations(
    tableIds: string[],
    date: Date,
    time: Date,
    duration: number
  ): Promise<Reservation[]> {
    const endTime = new Date(time);
    endTime.setMinutes(endTime.getMinutes() + duration);

    return this.prisma.reservation.findMany({
      where: {
        reservationDate: date,
        status: {
          in: ['PENDING', 'CONFIRMED', 'SEATED'],
        },
        AND: [
          {
            OR: [
              // Check legacy tableId field
              ...(tableIds.map(tableId => ({
                tableId: tableId,
              }))),
              // Check new tables relation
              {
                tables: {
                  some: {
                    tableId: {
                      in: tableIds,
                    },
                  },
                },
              },
            ],
          },
          {
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
        ],
      },
      include: {
        tables: true,
      },
    });
  }

  async update(id: string, data: UpdateReservationDto, expectedVersion?: number): Promise<Reservation> {
    const updateData: {
      tableId?: string | null;
      partySize?: number;
      reservationDate?: Date;
      reservationTime?: Date;
      customerName?: string;
      customerPhone?: string;
      specialRequests?: string;
      status?: ReservationStatus;
      statusUpdatedAt?: Date;
      version?: { increment: number };
    } = {};

    // Handle tableIds update - replace all tables
    if (data.tableIds !== undefined) {
      // Delete existing table relationships
      await this.prisma.reservationTable.deleteMany({
        where: { reservationId: id },
      });

      // Create new table relationships
      if (data.tableIds && data.tableIds.length > 0) {
        await this.prisma.reservationTable.createMany({
          data: data.tableIds.map(tableId => ({
            reservationId: id,
            tableId: tableId,
          })),
        });
      }

      // Update legacy tableId field for backward compatibility
      updateData.tableId = data.tableIds && data.tableIds.length === 1 ? data.tableIds[0]! : null;
    } else if (data.tableId !== undefined) {
      // Legacy support: single tableId
      updateData.tableId = data.tableId;
      // Also update the tables relation
      await this.prisma.reservationTable.deleteMany({
        where: { reservationId: id },
      });
      if (data.tableId) {
        await this.prisma.reservationTable.create({
          data: {
            reservationId: id,
            tableId: data.tableId,
          },
        });
      }
    }

    if (data.partySize !== undefined && data.partySize !== null) {
      updateData.partySize = data.partySize;
    }
    if (data.reservationDate) {
      updateData.reservationDate = new Date(data.reservationDate);
    }
    if (data.reservationTime) {
      const timeParts = data.reservationTime.split(':').map(Number);
      const hours = timeParts[0] ?? 0;
      const minutes = timeParts[1] ?? 0;
      const reservationTime = new Date();
      reservationTime.setHours(hours, minutes, 0, 0);
      updateData.reservationTime = reservationTime;
    }
    if (data.customerName !== undefined) {
      updateData.customerName = data.customerName ?? null;
    }
    if (data.customerPhone !== undefined) {
      updateData.customerPhone = data.customerPhone ?? null;
    }
    if (data.specialRequests !== undefined) {
      updateData.specialRequests = data.specialRequests ?? null;
    }
    if ((data as any).status !== undefined) {
      updateData.status = (data as any).status;
      updateData.statusUpdatedAt = new Date();
    }

    if (expectedVersion !== undefined) {
      updateData.version = { increment: 1 };
    }

    return this.prisma.reservation.update({
      where: {
        id,
        ...(expectedVersion !== undefined && { version: expectedVersion }),
      },
      data: updateData,
      include: {
        tables: true,
      },
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

  async removeTableFromReservation(reservationId: string, tableId: string): Promise<Reservation> {
    // Remove the table from the reservation
    await this.prisma.reservationTable.deleteMany({
      where: {
        reservationId: reservationId,
        tableId: tableId,
      },
    });

    // Update legacy tableId field if it matches
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { tables: true },
    });

    if (reservation) {
      const remainingTables = reservation.tables;
      const updateData: { tableId?: string | null } = {};

      if (remainingTables.length === 0) {
        updateData.tableId = null;
      } else if (remainingTables.length === 1) {
        updateData.tableId = remainingTables[0]!.tableId;
      } else {
        updateData.tableId = null; // Multiple tables, can't use legacy field
      }

      return this.prisma.reservation.update({
        where: { id: reservationId },
        data: updateData,
        include: { tables: true },
      });
    }

    throw new Error('Reservation not found');
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
      include: {
        tables: true,
      },
    });

    // Collect table IDs from both legacy tableId field and new tables relation
    const tableIds = new Set<string>();
    reservations.forEach((reservation: Reservation & { tables: Array<{ tableId: string }> }) => {
      // Legacy tableId
      if (reservation.tableId) {
        tableIds.add(reservation.tableId);
      }
      // New tables relation
      reservation.tables.forEach((rt: { tableId: string }) => {
        tableIds.add(rt.tableId);
      });
    });

    return Array.from(tableIds);
  }
}

