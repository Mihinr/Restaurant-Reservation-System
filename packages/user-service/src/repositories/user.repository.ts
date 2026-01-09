import { PrismaClient, Prisma } from '@prisma/client';

type User = Prisma.UserGetPayload<{}>;
type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';
import { CreateUserDto, UpdateUserDto } from '@restaurant-reservation/shared';

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    if (!prisma) {
      throw new Error('PrismaClient instance is required');
    }
    this.prisma = prisma;
  }

  async create(data: CreateUserDto & { passwordHash: string }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        passwordHash: data.passwordHash,
        role: (data.role || 'CUSTOMER') as Role,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const updateData: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone ?? null;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async findByRole(role: Role): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        role,
        deletedAt: null,
      },
    });
  }
}

