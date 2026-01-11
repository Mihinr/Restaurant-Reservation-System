import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { WaitlistController } from '../controllers/waitlist.controller';
import { WaitlistService } from '../services/waitlist.service';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createWaitlistEntrySchema } from '../validators/waitlist.validator';
import { USER_ROLES } from '@restaurant-reservation/shared';

export function createWaitlistRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const waitlistService = new WaitlistService(prisma);
  const waitlistController = new WaitlistController(waitlistService);

  // Customers can join waitlist
  router.post('/', authenticate, validate(createWaitlistEntrySchema), (req, res, next) => {
    waitlistController.join(req as any, res).catch(next);
  });

  // Customers can view their own waitlist entries
  router.get('/me', authenticate, (req, res, next) => {
    waitlistController.getByUser(req as any, res).catch(next);
  });

  // Staff/Admin can view waitlist
  router.get('/restaurants/:restaurantId', authenticate, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), (req, res, next) => {
    waitlistController.getByRestaurant(req, res).catch(next);
  });

  // Staff/Admin can update waitlist status
  router.put('/:id/status', authenticate, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), (req, res, next) => {
    waitlistController.updateStatus(req, res).catch(next);
  });

  // Customers can accept/decline their own notifications
  router.put('/:id/respond', authenticate, (req, res, next) => {
    waitlistController.respondToNotification(req as any, res).catch(next);
  });

  // Remove from waitlist (Customers can remove their own, Staff/Admin can remove any)
  router.delete('/:id', authenticate, (req, res, next) => {
    waitlistController.remove(req as any, res).catch(next);
  });

  return router;
}

