import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../config/logger';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Validation already done by middleware, so req.body is safe to use
      const result = await this.authService.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      throw error; // Let error handler middleware handle it
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    // Validation already done by middleware, so req.body is safe to use
    const result = await this.authService.login(req.body);
    res.json({
      success: true,
      data: result,
    });
  }

  async refresh(req: AuthRequest, res: Response): Promise<void> {
    // Validation already done by middleware, so req.body is safe to use
    const { refreshToken } = req.body;
    const result = await this.authService.refreshToken(refreshToken);
    res.json({
      success: true,
      data: result,
    });
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    await this.authService.logout(req.user.userId);
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

