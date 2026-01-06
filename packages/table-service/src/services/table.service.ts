import { PrismaClient } from '@prisma/client';
import { TableRepository } from '../repositories/table.repository';
import {
  CreateTableDto,
  UpdateTableDto,
  Table as TableType,
  TableAvailability,
} from '@restaurant-reservation/shared';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/AppError';

export class TableService {
  private tableRepository: TableRepository;

  constructor(private prisma: PrismaClient) {
    this.tableRepository = new TableRepository(prisma);
  }

  async createTable(data: CreateTableDto): Promise<TableType> {
    const existingTable = await this.prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId: data.restaurantId,
          tableNumber: data.tableNumber,
        },
      },
    });

    if (existingTable) {
      throw new ConflictError('Table with this number already exists in this restaurant');
    }

    const table = await this.tableRepository.create(data);
    return this.mapToTableType(table);
  }

  async getTableById(id: string): Promise<TableType> {
    const table = await this.tableRepository.findById(id);
    if (!table) {
      throw new NotFoundError('Table not found');
    }
    return this.mapToTableType(table);
  }

  async getTablesByRestaurant(restaurantId: string): Promise<TableType[]> {
    const tables = await this.tableRepository.findByRestaurant(restaurantId);
    return tables.map(this.mapToTableType);
  }

  async updateTable(id: string, data: UpdateTableDto): Promise<TableType> {
    const table = await this.tableRepository.findById(id);
    if (!table) {
      throw new NotFoundError('Table not found');
    }

    if (data.tableNumber && data.tableNumber !== table.tableNumber) {
      const existingTable = await this.prisma.table.findUnique({
        where: {
          restaurantId_tableNumber: {
            restaurantId: table.restaurantId,
            tableNumber: data.tableNumber,
          },
        },
      });

      if (existingTable) {
        throw new ConflictError('Table with this number already exists in this restaurant');
      }
    }

    const updatedTable = await this.tableRepository.update(id, data);
    return this.mapToTableType(updatedTable);
  }

  async updateTableStatus(id: string, status: TableType['status']): Promise<TableType> {
    const table = await this.tableRepository.findById(id);
    if (!table) {
      throw new NotFoundError('Table not found');
    }

    const updatedTable = await this.tableRepository.updateStatus(id, status);
    return this.mapToTableType(updatedTable);
  }

  async deleteTable(id: string): Promise<void> {
    const table = await this.tableRepository.findById(id);
    if (!table) {
      throw new NotFoundError('Table not found');
    }

    await this.tableRepository.delete(id);
  }

  async findAvailableTables(
    restaurantId: string,
    date: string,
    time: string,
    partySize: number,
    duration: number = 90,
    reservedTableIds: string[] = []
  ): Promise<TableAvailability[]> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    const tables = await this.tableRepository.findAvailableTables(restaurantId, partySize);

    const availableTables: TableAvailability[] = [];

    for (const table of tables) {
      if (table.capacity < partySize || table.minPartySize > partySize) {
        continue;
      }

      const isReserved = reservedTableIds.includes(table.id);
      const isAvailable = !isReserved && table.status === 'AVAILABLE';

      availableTables.push({
        tableId: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        minPartySize: table.minPartySize,
        available: isAvailable,
        score: this.calculateScore(table, partySize),
      });
    }

    return availableTables.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  private calculateScore(table: { capacity: number; minPartySize: number }, partySize: number): number {
    const capacityDiff = table.capacity - partySize;
    const minDiff = partySize - table.minPartySize;

    if (capacityDiff < 0 || minDiff < 0) {
      return 0;
    }

    return 100 - capacityDiff * 2 - minDiff;
  }

  private mapToTableType(table: {
    id: string;
    restaurantId: string;
    tableNumber: string;
    capacity: number;
    minPartySize: number;
    status: string;
    statusUpdatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): TableType {
    return {
      id: table.id,
      restaurantId: table.restaurantId,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      minPartySize: table.minPartySize,
      status: table.status as TableType['status'],
      statusUpdatedAt: table.statusUpdatedAt,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }
}

