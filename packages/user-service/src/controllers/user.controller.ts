import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { updateUserSchema } from '../validators/user.validator';

export class UserController {
  constructor(private userService: UserService) {}

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const user = await this.userService.getUserById(req.user.userId);
    res.json({
      success: true,
      data: user,
    });
  }

  async updateCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const data = updateUserSchema.parse(req.body);
    const user = await this.userService.updateUser(req.user.userId, data);
    res.json({
      success: true,
      data: user,
    });
  }

  async deleteCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    await this.userService.deleteUser(req.user.userId);
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  }
}

