import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { updateUserSchema } from '../validators/user.validator';
import { UpdateUserDto } from '@restaurant-reservation/shared';

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

    const validatedData = updateUserSchema.parse(req.body);
    // Construct DTO without undefined values for exactOptionalPropertyTypes
    const data: UpdateUserDto = {};
    if (validatedData.firstName !== undefined) data.firstName = validatedData.firstName;
    if (validatedData.lastName !== undefined) data.lastName = validatedData.lastName;
    if (validatedData.phone !== undefined) data.phone = validatedData.phone;
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

