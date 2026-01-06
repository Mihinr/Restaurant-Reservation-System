import { z } from 'zod';

export const createReservationSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  tableId: z.string().uuid('Invalid table ID').optional(),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  reservationTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  partySize: z.number().int().positive('Party size must be a positive integer'),
  customerName: z.string().min(1).max(255).optional(),
  customerPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  specialRequests: z.string().max(1000).optional(),
});

export const updateReservationSchema = createReservationSchema.partial().extend({
  version: z.number().int().positive().optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

