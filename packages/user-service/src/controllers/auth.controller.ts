import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: AuthRequest, res: Response): Promise<void> {
    const data = registerSchema.parse(req.body);
    const result = await this.authService.register(data);
    res.status(201).json({
      success: true,
      data: result,
    });
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    const credentials = loginSchema.parse(req.body);
    const result = await this.authService.login(credentials);
    res.json({
      success: true,
      data: result,
    });
  }

  async refresh(req: AuthRequest, res: Response): Promise<void> {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
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

