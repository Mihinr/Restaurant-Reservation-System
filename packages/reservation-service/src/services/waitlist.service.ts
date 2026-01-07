import { PrismaClient } from '../node_modules/.prisma/reservation-service-client';
import { WaitlistRepository } from '../repositories/waitlist.repository';
import { CreateWaitlistEntryDto, WaitlistEntry as WaitlistEntryType } from '@restaurant-reservation/shared';
import { NotFoundError } from '../errors/AppError';

export class WaitlistService {
  private waitlistRepository: WaitlistRepository;

  constructor(private prisma: PrismaClient) {
    this.waitlistRepository = new WaitlistRepository(prisma);
  }

  async joinWaitlist(userId: string, data: CreateWaitlistEntryDto): Promise<WaitlistEntryType> {
    const position = await this.waitlistRepository.getNextPosition(data.restaurantId);

    const entry = await this.waitlistRepository.create({
      ...data,
      userId,
      position,
    });

    return this.mapToWaitlistEntryType(entry);
  }

  async getWaitlistByRestaurant(restaurantId: string): Promise<WaitlistEntryType[]> {
    const entries = await this.waitlistRepository.findByRestaurant(restaurantId, 'WAITING');
    return entries.map(this.mapToWaitlistEntryType);
  }

  async updateWaitlistStatus(id: string, status: WaitlistEntryType['status']): Promise<WaitlistEntryType> {
    const entry = await this.waitlistRepository.findById(id);
    if (!entry) {
      throw new NotFoundError('Waitlist entry not found');
    }

    const updated = await this.waitlistRepository.updateStatus(id, status);
    return this.mapToWaitlistEntryType(updated);
  }

  async removeFromWaitlist(id: string): Promise<void> {
    const entry = await this.waitlistRepository.findById(id);
    if (!entry) {
      throw new NotFoundError('Waitlist entry not found');
    }

    await this.waitlistRepository.delete(id);
  }

  private mapToWaitlistEntryType(entry: {
    id: string;
    restaurantId: string;
    userId: string;
    partySize: number;
    phoneNumber: string;
    name: string;
    status: string;
    position: number;
    estimatedWaitTime: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): WaitlistEntryType {
    return {
      id: entry.id,
      restaurantId: entry.restaurantId,
      userId: entry.userId,
      partySize: entry.partySize,
      phoneNumber: entry.phoneNumber,
      name: entry.name,
      status: entry.status as WaitlistEntryType['status'],
      position: entry.position,
      estimatedWaitTime: entry.estimatedWaitTime || undefined,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}

