import { Response } from 'express';
import { Request } from 'express';
import { z } from 'zod';
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

    // Validation already done by middleware, but we need to ensure type safety
    const data = req.body as z.infer<typeof createReservationSchema>;
    const reservation = await this.reservationService.createReservation(req.user.userId, data);
    res.status(201).json({
      success: true,
      data: reservation,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const reservation = await this.reservationService.getReservationById(id);
      res.json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      // Handle rate limiting errors specifically
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        res.status(429).json({
          success: false,
          error: error.message,
          message: 'Too many requests. Please wait a moment and try again.',
        });
        return;
      }
      throw error; // Re-throw to be handled by error middleware
    }
  }

  async getByUser(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    try {
      const reservations = await this.reservationService.getReservationsByUser(req.user.userId);
      res.json({
        success: true,
        data: reservations,
      });
    } catch (error) {
      // Handle rate limiting errors specifically
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        res.status(429).json({
          success: false,
          error: error.message,
          message: 'Too many requests. Please wait a moment and try again.',
        });
        return;
      }
      throw error; // Re-throw to be handled by error middleware
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    // Validation already done by middleware, but we need to ensure type safety
    const data = req.body as z.infer<typeof updateReservationSchema>;
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

  async getReservedTableIds(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params;
    const { date, time, duration } = req.query;

    if (!date || !time) {
      res.status(400).json({
        success: false,
        error: 'Date and time are required',
      });
      return;
    }

    const tableIds = await this.reservationService.getReservedTableIds(
      restaurantId,
      date as string,
      time as string,
      duration ? parseInt(duration as string, 10) : 90
    );

    res.json({
      success: true,
      data: tableIds,
    });
  }
}

