import { PrismaClient, Prisma } from '@prisma/client';

type Table = Prisma.TableGetPayload<{}>;
type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
import { CreateTableDto, UpdateTableDto } from '@restaurant-reservation/shared';

export class TableRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    if (!prisma) {
      throw new Error('PrismaClient instance is required');
    }
    this.prisma = prisma;
  }

  async create(data: CreateTableDto): Promise<Table> {
    return this.prisma.table.create({
      data: {
        restaurantId: data.restaurantId,
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        minPartySize: data.minPartySize || 1,
      },
    });
  }

  async findById(id: string): Promise<Table | null> {
    return this.prisma.table.findUnique({
      where: { id },
      include: { restaurant: true },
    });
  }

  async findByIds(ids: string[]): Promise<Table[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.prisma.table.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<Table[]> {
    return this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: 'asc' },
    });
  }

  async findByRestaurantAndStatus(restaurantId: string, status: TableStatus): Promise<Table[]> {
    return this.prisma.table.findMany({
      where: {
        restaurantId,
        status,
      },
      orderBy: { tableNumber: 'asc' },
    });
  }

  async update(id: string, data: UpdateTableDto): Promise<Table> {
    const updateData: {
      tableNumber?: string;
      capacity?: number;
      minPartySize?: number;
      status?: TableStatus;
      statusUpdatedAt?: Date;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.tableNumber !== undefined) {
      updateData.tableNumber = data.tableNumber;
    }
    if (data.capacity !== undefined) {
      updateData.capacity = data.capacity;
    }
    if (data.minPartySize !== undefined) {
      updateData.minPartySize = data.minPartySize;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      updateData.statusUpdatedAt = new Date();
    }

    return this.prisma.table.update({
      where: { id },
      data: updateData,
    });
  }

  async updateStatus(id: string, status: TableStatus): Promise<Table> {
    return this.prisma.table.update({
      where: { id },
      data: {
        status,
        statusUpdatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.table.delete({
      where: { id },
    });
  }

  async findAvailableTables(
    restaurantId: string,
    minCapacity: number,
    maxCapacity?: number
  ): Promise<Table[]> {
    return this.prisma.table.findMany({
      where: {
        restaurantId,
        status: 'AVAILABLE',
        capacity: {
          gte: minCapacity,
          ...(maxCapacity && { lte: maxCapacity }),
        },
      },
      orderBy: { capacity: 'asc' },
    });
  }
}

