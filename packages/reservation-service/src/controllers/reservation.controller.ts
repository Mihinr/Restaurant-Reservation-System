import { Response } from 'express';
import { Request } from 'express';
import { ReservationService } from '../services/reservation.service';
import { createReservationSchema, updateReservationSchema } from '../validators/reservation.validator';

interface AuthRequest extends Request {
  user?: { userId: string };
}

export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  async create(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const data = createReservationSchema.parse(req.body);
    const reservation = await this.reservationService.createReservation(req.user.userId, data);
    res.status(201).json({
      success: true,
      data: reservation,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const reservation = await this.reservationService.getReservationById(id);
    res.json({
      success: true,
      data: reservation,
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

    const reservations = await this.reservationService.getReservationsByUser(req.user.userId);
    res.json({
      success: true,
      data: reservations,
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data = updateReservationSchema.parse(req.body);
    const reservation = await this.reservationService.updateReservation(id, data, data.version);
    res.json({
      success: true,
      data: reservation,
    });
  }

  async cancel(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await this.reservationService.cancelReservation(id);
    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
    });
  }
}

