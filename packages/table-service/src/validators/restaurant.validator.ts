import { z } from 'zod';

export const createRestaurantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  zipCode: z.string().min(1, 'Zip code is required').max(20),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  email: z.string().email().optional(),
  timezone: z.string().default('America/New_York'),
  openingTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  closingTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
});

export const updateRestaurantSchema = createRestaurantSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;

