import { PrismaClient, Prisma } from '@prisma/client';

type UserSession = Prisma.UserSessionGetPayload<{}>;
import { hashPassword } from '../utils/password';

export class SessionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, token: string, expiresAt: Date): Promise<UserSession> {
    const tokenHash = await hashPassword(token);
    return this.prisma.userSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<UserSession | null> {
    return this.prisma.userSession.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.userSession.delete({
      where: { id },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}

