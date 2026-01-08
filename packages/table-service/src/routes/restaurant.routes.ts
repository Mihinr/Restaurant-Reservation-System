import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { RestaurantController } from '../controllers/restaurant.controller';
import { RestaurantService } from '../services/restaurant.service';
import { validate } from '../middlewares/validate.middleware';
import { createRestaurantSchema, updateRestaurantSchema, batchRestaurantSchema } from '../validators/restaurant.validator';

export function createRestaurantRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const restaurantService = new RestaurantService(prisma);
  const restaurantController = new RestaurantController(restaurantService);

  router.post('/', validate(createRestaurantSchema), (req, res, next) => {
    restaurantController.create(req, res).catch(next);
  });

  router.get('/', (req, res, next) => {
    restaurantController.getAll(req, res).catch(next);
  });

  router.post('/batch', validate(batchRestaurantSchema), (req, res, next) => {
    restaurantController.getBatch(req, res).catch(next);
  });

  router.get('/:id', (req, res, next) => {
    restaurantController.getById(req, res).catch(next);
  });

  router.put('/:id', validate(updateRestaurantSchema), (req, res, next) => {
    restaurantController.update(req, res).catch(next);
  });

  router.delete('/:id', (req, res, next) => {
    restaurantController.delete(req, res).catch(next);
  });

  return router;
}

