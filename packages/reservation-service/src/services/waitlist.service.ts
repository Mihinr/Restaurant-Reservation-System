import { PrismaClient } from '@prisma/client';
import { WaitlistRepository } from '../repositories/waitlist.repository';
import { logger } from '../config/logger';
import { CreateWaitlistEntryDto, WaitlistEntry as WaitlistEntryType } from '@restaurant-reservation/shared';
import { NotFoundError } from '../errors/AppError';
import { getIO } from '../socket';
import { SocketEvents } from '@restaurant-reservation/shared';

export class WaitlistService {
  private waitlistRepository: WaitlistRepository;

  constructor(_prisma: PrismaClient) {
    this.waitlistRepository = new WaitlistRepository(_prisma);
  }

  async joinWaitlist(userId: string, data: CreateWaitlistEntryDto): Promise<WaitlistEntryType> {
    const position = await this.waitlistRepository.getNextPosition(data.restaurantId);

    const entry = await this.waitlistRepository.create({
      ...data,
      userId,
      position,
    });

    const mappedEntry = this.mapToWaitlistEntryType(entry);

    try {
      const io = getIO();
      io.emit(SocketEvents.WAITLIST_JOINED, mappedEntry);
    } catch (error) {
      logger.error('Failed to emit socket events:', error);
    }

    return mappedEntry;
  }

  async getWaitlistByRestaurant(restaurantId: string): Promise<WaitlistEntryType[]> {
    // Return all active entries (WAITING, NOTIFIED, SEATED) for staff dashboard
    const entries = await this.waitlistRepository.findByRestaurant(restaurantId);
    return entries.map(this.mapToWaitlistEntryType);
  }

  async getWaitlistByUser(userId: string): Promise<WaitlistEntryType[]> {
    const entries = await this.waitlistRepository.findByUserId(userId);
    return entries.map(this.mapToWaitlistEntryType);
  }

  async getWaitlistEntryById(id: string): Promise<WaitlistEntryType | null> {
    const entry = await this.waitlistRepository.findById(id);
    if (!entry) {
      return null;
    }
    return this.mapToWaitlistEntryType(entry);
  }

  async updateWaitlistStatus(id: string, status: WaitlistEntryType['status']): Promise<WaitlistEntryType> {
    const entry = await this.waitlistRepository.findById(id);
    if (!entry) {
      throw new NotFoundError('Waitlist entry not found');
    }

    const updated = await this.waitlistRepository.updateStatus(id, status);
    const mappedEntry = this.mapToWaitlistEntryType(updated);

    try {
      const io = getIO();
      io.emit(SocketEvents.WAITLIST_UPDATED, mappedEntry);
    } catch (error) {
      logger.error('Failed to emit socket events:', error);
    }

    return mappedEntry;
  }

  async removeFromWaitlist(id: string): Promise<void> {
    const entry = await this.waitlistRepository.findById(id);
    if (!entry) {
      throw new NotFoundError('Waitlist entry not found');
    }

    await this.waitlistRepository.delete(id);

    try {
      const io = getIO();
      // Emit minimal data needed for removal (id and restaurantId are usually enough)
      // Since we fetched 'entry' before, we can use it.
      const mappedEntry = this.mapToWaitlistEntryType(entry);
      io.emit(SocketEvents.WAITLIST_REMOVED, mappedEntry);
    } catch (error) {
      logger.error('Failed to emit socket events:', error);
    }
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
    reservationDate: Date | null;
    reservationTime: Date | null;
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
      ...(entry.estimatedWaitTime !== null ? { estimatedWaitTime: entry.estimatedWaitTime } : {}),
      ...(entry.reservationDate ? { reservationDate: entry.reservationDate } : {}),
      ...(entry.reservationTime ? { reservationTime: entry.reservationTime } : {}),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}

