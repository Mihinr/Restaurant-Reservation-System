import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationService } from '../services/reservation.service';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { createReservationSchema, updateReservationSchema } from '../validators/reservation.validator';

/**
 * @openapi
 * tags:
 *   name: Reservations
 *   description: Reservation management
 */

/**
 * @openapi
 * /api/v1/reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - partySize
 *               - reservationDate
 *               - reservationTime
 *             properties:
 *               restaurantId:
 *                 type: string
 *               partySize:
 *                 type: integer
 *               reservationDate:
 *                 type: string
 *                 format: date
 *               reservationTime:
 *                 type: string
 *                 format: time
 *     responses:
 *       201:
 *         description: Reservation created successfully
 */

/**
 * @openapi
 * /api/v1/reservations:
 *   get:
 *     summary: Get user's reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reservations
 */

export function createReservationRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const reservationService = new ReservationService(prisma);
  const reservationController = new ReservationController(reservationService);

  router.post('/', authenticate, validate(createReservationSchema), (req, res, next) => {
    reservationController.create(req as any, res).catch(next);
  });

  router.get('/', authenticate, (req, res, next) => {
    reservationController.getByUser(req as any, res).catch(next);
  });

  router.get('/restaurants/:restaurantId/reserved-tables', (req, res, next) => {
    reservationController.getReservedTableIds(req, res).catch(next);
  });

  router.get('/:id', (req, res, next) => {
    reservationController.getById(req, res).catch(next);
  });

  router.put('/:id', authenticate, validate(updateReservationSchema), (req, res, next) => {
    reservationController.update(req, res).catch(next);
  });

  router.delete('/:id', authenticate, (req, res, next) => {
    reservationController.cancel(req, res).catch(next);
  });

  router.delete('/:id/tables/:tableId', authenticate, (req, res, next) => {
    reservationController.removeTable(req, res).catch(next);
  });

  return router;
}

