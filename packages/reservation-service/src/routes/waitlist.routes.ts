import { Router } from 'express';
import { PrismaClient } from '../node_modules/.prisma/reservation-service-client';
import { WaitlistController } from '../controllers/waitlist.controller';
import { WaitlistService } from '../services/waitlist.service';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createWaitlistEntrySchema } from '../validators/waitlist.validator';

export function createWaitlistRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const waitlistService = new WaitlistService(prisma);
  const waitlistController = new WaitlistController(waitlistService);

  // Customers can join waitlist
  router.post('/', authenticate, validate(createWaitlistEntrySchema), (req, res, next) => {
    waitlistController.join(req as any, res).catch(next);
  });

  // Staff/Admin can view waitlist
  router.get('/restaurants/:restaurantId', authenticate, authorize('STAFF', 'ADMIN'), (req, res, next) => {
    waitlistController.getByRestaurant(req, res).catch(next);
  });

  // Staff/Admin can update waitlist status
  router.put('/:id/status', authenticate, authorize('STAFF', 'ADMIN'), (req, res, next) => {
    waitlistController.updateStatus(req, res).catch(next);
  });

  // Staff/Admin can remove from waitlist
  router.delete('/:id', authenticate, authorize('STAFF', 'ADMIN'), (req, res, next) => {
    waitlistController.remove(req, res).catch(next);
  });

  return router;
}

