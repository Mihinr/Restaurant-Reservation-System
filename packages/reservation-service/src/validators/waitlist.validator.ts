import { z } from 'zod';

export const createWaitlistEntrySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  partySize: z.number().int().positive('Party size must be a positive integer'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  name: z.string().min(1, 'Name is required').max(255),
});

export type CreateWaitlistEntryInput = z.infer<typeof createWaitlistEntrySchema>;

