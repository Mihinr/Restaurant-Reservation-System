import { z } from 'zod';

export const createTableSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  tableNumber: z.string().min(1, 'Table number is required').max(20),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  minPartySize: z.number().int().positive().default(1),
});

export const updateTableSchema = z.object({
  tableNumber: z.string().min(1).max(20).optional(),
  capacity: z.number().int().positive().optional(),
  minPartySize: z.number().int().positive().optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE']).optional(),
});

export const availabilitySearchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  partySize: z.coerce.number().int().positive('Party size must be a positive integer'),
  duration: z.coerce.number().int().positive().default(90),
});

export const batchTableSchema = z.object({
  ids: z.array(z.string().uuid('Invalid table ID')).min(1, 'At least one table ID is required').max(100, 'Maximum 100 table IDs allowed'),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type AvailabilitySearchInput = z.infer<typeof availabilitySearchSchema>;
export type BatchTableInput = z.infer<typeof batchTableSchema>;

