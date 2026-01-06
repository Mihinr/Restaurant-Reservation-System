import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationService } from '../services/reservation.service';
import { validate } from '../middlewares/validate.middleware';
import { createReservationSchema, updateReservationSchema } from '../validators/reservation.validator';

export function createReservationRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const reservationService = new ReservationService(prisma);
  const reservationController = new ReservationController(reservationService);

  router.post('/', validate(createReservationSchema), (req, res, next) => {
    reservationController.create(req as any, res).catch(next);
  });

  router.get('/', (req, res, next) => {
    reservationController.getByUser(req as any, res).catch(next);
  });

  router.get('/:id', (req, res, next) => {
    reservationController.getById(req, res).catch(next);
  });

  router.put('/:id', validate(updateReservationSchema), (req, res, next) => {
    reservationController.update(req, res).catch(next);
  });

  router.delete('/:id', (req, res, next) => {
    reservationController.cancel(req, res).catch(next);
  });

  return router;
}

