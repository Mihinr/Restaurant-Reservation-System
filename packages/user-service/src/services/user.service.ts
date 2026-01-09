import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto, User as UserType } from '@restaurant-reservation/shared';
import { hashPassword, comparePassword } from '../utils/password';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/AppError';

export class UserService {
  private userRepository: UserRepository;

  constructor(_prisma: PrismaClient) {
    this.userRepository = new UserRepository(_prisma);
  }

  async createUser(data: CreateUserDto): Promise<UserType> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);
    // Construct repository data without password
    const userData: Omit<CreateUserDto, 'password'> & { passwordHash: string } = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash,
    };
    if (data.phone) {
      userData.phone = data.phone;
    }
    if (data.role) {
      userData.role = data.role;
    }
    const user = await this.userRepository.create(userData as CreateUserDto & { passwordHash: string });

    return this.mapToUserType(user);
  }

  async getUserById(id: string): Promise<UserType> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.mapToUserType(user);
  }

  async getUserByEmail(email: string): Promise<UserType | null> {
    const user = await this.userRepository.findByEmail(email);
    return user ? this.mapToUserType(user) : null;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserType> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await this.userRepository.update(id, data);
    return this.mapToUserType(updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.userRepository.softDelete(id);
  }

  async verifyPassword(email: string, password: string): Promise<UserType> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestError('Invalid email or password');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new BadRequestError('Invalid email or password');
    }

    return this.mapToUserType(user);
  }

  private mapToUserType(user: {
    id: string;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): UserType {
    return {
      id: user.id,
      email: user.email,
      ...(user.phone ? { phone: user.phone } : {}),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserType['role'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(user.deletedAt ? { deletedAt: user.deletedAt } : {}),
    };
  }
}

