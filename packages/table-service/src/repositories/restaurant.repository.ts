import { PrismaClient, Prisma } from '@prisma/client';

type Restaurant = Prisma.RestaurantGetPayload<{}>;
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
        phone: data.phone ?? null,
        email: data.email ?? null,
        timezone: data.timezone || 'America/New_York',
        openingTime: data.openingTime ? new Date(data.openingTime) : new Date('1970-01-01T11:00:00Z'),
        closingTime: data.closingTime ? new Date(data.closingTime) : new Date('1970-01-01T22:00:00Z'),
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
    const updateData: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      phone?: string | null;
      email?: string | null;
      timezone?: string;
      openingTime?: Date;
      closingTime?: Date;
      isActive?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.phone !== undefined) updateData.phone = data.phone ?? null;
    if (data.email !== undefined) updateData.email = data.email ?? null;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.openingTime !== undefined) {
      updateData.openingTime = new Date(data.openingTime);
    }
    if (data.closingTime !== undefined) {
      updateData.closingTime = new Date(data.closingTime);
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.restaurant.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.restaurant.delete({
      where: { id },
    });
  }
}

