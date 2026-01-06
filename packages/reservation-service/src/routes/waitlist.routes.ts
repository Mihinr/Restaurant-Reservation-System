import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { WaitlistController } from '../controllers/waitlist.controller';
import { WaitlistService } from '../services/waitlist.service';
import { validate } from '../middlewares/validate.middleware';
import { createWaitlistEntrySchema } from '../validators/waitlist.validator';

export function createWaitlistRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const waitlistService = new WaitlistService(prisma);
  const waitlistController = new WaitlistController(waitlistService);

  router.post('/', validate(createWaitlistEntrySchema), (req, res, next) => {
    waitlistController.join(req as any, res).catch(next);
  });

  router.get('/restaurants/:restaurantId', (req, res, next) => {
    waitlistController.getByRestaurant(req, res).catch(next);
  });

  router.put('/:id/status', (req, res, next) => {
    waitlistController.updateStatus(req, res).catch(next);
  });

  router.delete('/:id', (req, res, next) => {
    waitlistController.remove(req, res).catch(next);
  });

  return router;
}

