import { z } from 'zod';

// Base schema object (without refine) - needed for .partial() method
const baseReservationSchemaObject = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  tableId: z.string().uuid('Invalid table ID').optional(), // Deprecated: use tableIds instead
  tableIds: z.array(z.string().uuid('Invalid table ID')).min(1, 'At least one table must be selected').optional(),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  reservationTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  partySize: z.number().int().positive('Party size must be a positive integer'),
  customerName: z.string().max(255).optional(),
  customerPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  specialRequests: z.string().max(1000).optional(),
});

// Base schema with validation refine for create
const baseReservationSchema = baseReservationSchemaObject.refine(
  (data) => data.tableId || (data.tableIds && data.tableIds.length > 0),
  {
    message: 'Either tableId or tableIds must be provided',
  }
);

// Preprocess the entire object to convert empty strings to undefined for optional fields
const preprocessEmptyStrings = z.preprocess(
  (data) => {
    if (typeof data !== 'object' || data === null) return data;
    const processed = { ...data };
    // Convert empty strings to undefined for optional fields
    if (processed.customerName === '') processed.customerName = undefined;
    if (processed.customerPhone === '') processed.customerPhone = undefined;
    if (processed.specialRequests === '') processed.specialRequests = undefined;
    if (processed.tableId === '') processed.tableId = undefined;
    return processed;
  },
  baseReservationSchema
);

export const createReservationSchema = preprocessEmptyStrings;

// For update, we need to preprocess and then make fields partial
// Use baseReservationSchemaObject (not baseReservationSchema) so we can call .partial()
const preprocessForUpdate = z.preprocess(
  (data) => {
    if (typeof data !== 'object' || data === null) return data;
    const processed = { ...data };
    // Convert empty strings to undefined for optional fields
    if (processed.customerName === '') processed.customerName = undefined;
    if (processed.customerPhone === '') processed.customerPhone = undefined;
    if (processed.specialRequests === '') processed.specialRequests = undefined;
    if (processed.tableId === '') processed.tableId = undefined;
    // Handle tableIds array
    if (Array.isArray(processed.tableIds) && processed.tableIds.length === 0) {
      processed.tableIds = undefined;
    }
    return processed;
  },
  baseReservationSchemaObject.partial().extend({
    version: z.number().int().positive().optional(),
    tableIds: z.array(z.string().uuid('Invalid table ID')).optional(), // Allow empty array for update
  })
);

export const updateReservationSchema = preprocessForUpdate;

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

