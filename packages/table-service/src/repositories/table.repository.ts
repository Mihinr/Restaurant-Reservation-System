import { PrismaClient, Table, TableStatus } from '@prisma/client';
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
    return this.prisma.table.update({
      where: { id },
      data: {
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        minPartySize: data.minPartySize,
        status: data.status,
        statusUpdatedAt: data.status ? new Date() : undefined,
        updatedAt: new Date(),
      },
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

