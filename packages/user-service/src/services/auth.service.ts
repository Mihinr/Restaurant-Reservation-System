import { PrismaClient } from '@prisma/client';
import { UserService } from './user.service';
import { SessionRepository } from '../repositories/session.repository';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt';
import { LoginCredentials, AuthResponse, CreateUserDto, UserRole } from '@restaurant-reservation/shared';
import { UnauthorizedError } from '../errors/AppError';
import { hashPassword } from '../utils/password';

export class AuthService {
  private userService: UserService;
  private sessionRepository: SessionRepository;

  constructor(_prisma: PrismaClient) {
    this.userService = new UserService(_prisma);
    this.sessionRepository = new SessionRepository(_prisma);
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }): Promise<AuthResponse> {
    // Construct CreateUserDto properly
    const userData: CreateUserDto = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    if (data.phone) {
      userData.phone = data.phone;
    }
    if (data.role && ['CUSTOMER', 'STAFF', 'ADMIN'].includes(data.role)) {
      userData.role = data.role as UserRole;
    }
    const user = await this.userService.createUser(userData);

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionRepository.create(user.id, refreshToken, expiresAt);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const user = await this.userService.verifyPassword(credentials.email, credentials.password);

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionRepository.create(user.id, refreshToken, expiresAt);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = verifyRefreshToken(refreshToken);

      const tokenHash = await hashPassword(refreshToken);
      const session = await this.sessionRepository.findByTokenHash(tokenHash);

      if (!session || session.userId !== payload.userId) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const newTokenPayload: TokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      return {
        accessToken: generateAccessToken(newTokenPayload),
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.sessionRepository.deleteByUserId(userId);
  }
}

