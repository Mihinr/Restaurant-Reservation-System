import { Response } from 'express';
import { Request } from 'express';
import { z } from 'zod';
import { ReservationService } from '../services/reservation.service';
import { createReservationSchema, updateReservationSchema } from '../validators/reservation.validator';
import { AuthRequest } from '../middlewares/auth.middleware';
import { isStaffOrAdmin, CreateReservationDto, UpdateReservationDto } from '@restaurant-reservation/shared';

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

    try {
      // Validation already done by middleware, but we need to ensure type safety
      const validatedData = req.body as z.infer<typeof createReservationSchema>;
      // Construct DTO without undefined values for exactOptionalPropertyTypes
      const data: CreateReservationDto = {
        restaurantId: validatedData.restaurantId,
        reservationDate: validatedData.reservationDate,
        reservationTime: validatedData.reservationTime,
        partySize: validatedData.partySize,
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
      };
      if (validatedData.tableIds && validatedData.tableIds.length > 0) {
        data.tableIds = validatedData.tableIds;
      } else if (validatedData.tableId) {
        data.tableId = validatedData.tableId;
      }
      if (validatedData.specialRequests) {
        data.specialRequests = validatedData.specialRequests;
      }
      const reservation = await this.reservationService.createReservation(req.user.userId, data);
      res.status(201).json({
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

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Reservation ID is required',
      });
      return;
    }
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
      // If user is STAFF or ADMIN, return all reservations; otherwise return only their own
      let reservations;
      if (isStaffOrAdmin(req.user.role)) {
        reservations = await this.reservationService.getAllReservations();
      } else {
        reservations = await this.reservationService.getReservationsByUser(req.user.userId);
      }
      
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
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Reservation ID is required',
      });
      return;
    }
    // Validation already done by middleware, but we need to ensure type safety
    const validatedData = req.body as z.infer<typeof updateReservationSchema>;
    // Construct DTO without undefined values for exactOptionalPropertyTypes
    const data: UpdateReservationDto = {};
    if (validatedData.tableIds !== undefined) {
      data.tableIds = validatedData.tableIds;
    } else if (validatedData.tableId !== undefined) {
      data.tableId = validatedData.tableId;
    }
    if (validatedData.reservationDate !== undefined) {
      data.reservationDate = validatedData.reservationDate;
    }
    if (validatedData.reservationTime !== undefined) {
      data.reservationTime = validatedData.reservationTime;
    }
    if (validatedData.partySize !== undefined) {
      data.partySize = validatedData.partySize;
    }
    if (validatedData.customerName !== undefined) {
      data.customerName = validatedData.customerName;
    }
    if (validatedData.customerPhone !== undefined) {
      data.customerPhone = validatedData.customerPhone;
    }
    if (validatedData.specialRequests !== undefined) {
      data.specialRequests = validatedData.specialRequests;
    }
    if ((validatedData as any).status !== undefined) {
      (data as any).status = (validatedData as any).status;
    }
    const reservation = await this.reservationService.updateReservation(id, data, validatedData.version);
    res.json({
      success: true,
      data: reservation,
    });
  }

  async cancel(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Reservation ID is required',
      });
      return;
    }
    await this.reservationService.cancelReservation(id);
    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
    });
  }

  async getReservedTableIds(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params;
    const { date, time, duration } = req.query;

    if (!restaurantId) {
      res.status(400).json({
        success: false,
        error: 'Restaurant ID is required',
      });
      return;
    }

    if (!date || !time || typeof date !== 'string' || typeof time !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Date and time are required',
      });
      return;
    }

    const durationMinutes = duration ? parseInt(duration as string, 10) : 90;
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid duration',
      });
      return;
    }

    const tableIds = await this.reservationService.getReservedTableIds(
      restaurantId,
      date,
      time,
      durationMinutes
    );

    res.json({
      success: true,
      data: tableIds,
    });
  }

  async removeTable(req: Request, res: Response): Promise<void> {
    const { id, tableId } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Reservation ID is required',
      });
      return;
    }

    if (!tableId) {
      res.status(400).json({
        success: false,
        error: 'Table ID is required',
      });
      return;
    }

    const reservation = await this.reservationService.removeTableFromReservation(id, tableId);
    res.json({
      success: true,
      data: reservation,
      message: 'Table removed from reservation successfully',
    });
  }
}

