import { PrismaClient, User, Role } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from '@restaurant-reservation/shared';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateUserDto & { passwordHash: string }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        passwordHash: data.passwordHash,
        role: data.role || 'CUSTOMER',
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
    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        updatedAt: new Date(),
      },
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

