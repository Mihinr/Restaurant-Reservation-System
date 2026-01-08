import { Response } from 'express';
import { Request } from 'express';
import { WaitlistService } from '../services/waitlist.service';
import { createWaitlistEntrySchema } from '../validators/waitlist.validator';
import { AuthRequest } from '../middlewares/auth.middleware';

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

  async getByUser(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const entries = await this.waitlistService.getWaitlistByUser(req.user.userId);
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

  async respondToNotification(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "accept" or "decline"',
      });
      return;
    }

    // Verify the entry belongs to the user
    const entry = await this.waitlistService.getWaitlistEntryById(id);
    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'Waitlist entry not found',
      });
      return;
    }

    if (entry.userId !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'You can only respond to your own notifications',
      });
      return;
    }

    if (entry.status !== 'NOTIFIED') {
      res.status(400).json({
        success: false,
        error: 'Entry is not in NOTIFIED status',
      });
      return;
    }

    // Update status based on action
    const newStatus = action === 'accept' ? 'SEATED' : 'WAITING';
    const updated = await this.waitlistService.updateWaitlistStatus(id, newStatus);
    
    res.json({
      success: true,
      data: updated,
      message: action === 'accept' ? 'You have been seated!' : 'You have been moved back to the waitlist',
    });
  }
}

