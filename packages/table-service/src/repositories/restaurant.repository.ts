import { PrismaClient, Restaurant } from '../../node_modules/.prisma/table-service-client';
import { CreateRestaurantDto, UpdateRestaurantDto } from '@restaurant-reservation/shared';

export class RestaurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    if (!prisma) {
      throw new Error('PrismaClient instance is required');
    }
    this.prisma = prisma;
  }

  async create(data: CreateRestaurantDto): Promise<Restaurant> {
    return this.prisma.restaurant.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
        timezone: data.timezone || 'America/New_York',
        openingTime: data.openingTime || '11:00:00',
        closingTime: data.closingTime || '22:00:00',
      },
    });
  }

  async findById(id: string): Promise<Restaurant | null> {
    return this.prisma.restaurant.findUnique({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<Restaurant[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.prisma.restaurant.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async findAll(filters?: { city?: string; state?: string; isActive?: boolean }): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({
      where: {
        ...(filters?.city && { city: filters.city }),
        ...(filters?.state && { state: filters.state }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, data: UpdateRestaurantDto): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
        timezone: data.timezone,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.restaurant.delete({
      where: { id },
    });
  }
}

