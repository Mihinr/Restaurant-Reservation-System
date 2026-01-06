import { Response } from 'express';
import { Request } from 'express';
import { WaitlistService } from '../services/waitlist.service';
import { createWaitlistEntrySchema } from '../validators/waitlist.validator';

interface AuthRequest extends Request {
  user?: { userId: string };
}

export class WaitlistController {
  constructor(private waitlistService: WaitlistService) {}

  async join(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const data = createWaitlistEntrySchema.parse(req.body);
    const entry = await this.waitlistService.joinWaitlist(req.user.userId, data);
    res.status(201).json({
      success: true,
      data: entry,
    });
  }

  async getByRestaurant(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params;
    const entries = await this.waitlistService.getWaitlistByRestaurant(restaurantId);
    res.json({
      success: true,
      data: entries,
    });
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    if (!['WAITING', 'NOTIFIED', 'SEATED', 'CANCELLED'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
      return;
    }
    const entry = await this.waitlistService.updateWaitlistStatus(id, status);
    res.json({
      success: true,
      data: entry,
    });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await this.waitlistService.removeFromWaitlist(id);
    res.json({
      success: true,
      message: 'Removed from waitlist successfully',
    });
  }
}

