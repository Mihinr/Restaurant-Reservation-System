import { PrismaClient, WaitlistEntry, WaitlistStatus } from '@prisma/client';
import { CreateWaitlistEntryDto } from '@restaurant-reservation/shared';

export class WaitlistRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    if (!prisma) {
      throw new Error('PrismaClient instance is required');
    }
    this.prisma = prisma;
  }

  async create(data: CreateWaitlistEntryDto & { userId: string; position: number }): Promise<WaitlistEntry> {
    return this.prisma.waitlistEntry.create({
      data: {
        restaurantId: data.restaurantId,
        userId: data.userId,
        partySize: data.partySize,
        phoneNumber: data.phoneNumber,
        name: data.name,
        position: data.position,
        status: 'WAITING',
      },
    });
  }

  async findById(id: string): Promise<WaitlistEntry | null> {
    return this.prisma.waitlistEntry.findUnique({
      where: { id },
    });
  }

  async findByRestaurant(restaurantId: string, status?: WaitlistStatus): Promise<WaitlistEntry[]> {
    return this.prisma.waitlistEntry.findMany({
      where: {
        restaurantId,
        ...(status && { status }),
      },
      orderBy: { position: 'asc' },
    });
  }

  async findByUserId(userId: string): Promise<WaitlistEntry[]> {
    return this.prisma.waitlistEntry.findMany({
      where: {
        userId,
        status: {
          in: ['WAITING', 'NOTIFIED'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNextPosition(restaurantId: string): Promise<number> {
    const lastEntry = await this.prisma.waitlistEntry.findFirst({
      where: {
        restaurantId,
        status: 'WAITING',
      },
      orderBy: { position: 'desc' },
    });

    return lastEntry ? lastEntry.position + 1 : 1;
  }

  async updateStatus(id: string, status: WaitlistStatus): Promise<WaitlistEntry> {
    return this.prisma.waitlistEntry.update({
      where: { id },
      data: { status },
    });
  }

  async updatePosition(id: string, position: number): Promise<WaitlistEntry> {
    return this.prisma.waitlistEntry.update({
      where: { id },
      data: { position },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.waitlistEntry.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}

