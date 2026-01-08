import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateUserSchema } from '../validators/user.validator';

export function createUserRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const userService = new UserService(prisma);
  const userController = new UserController(userService);

  router.use(authenticate);

  router.get('/me', (req, res, next) => {
    userController.getCurrentUser(req as any, res).catch(next);
  });

  router.put('/me', validate(updateUserSchema), (req, res, next) => {
    userController.updateCurrentUser(req as any, res).catch(next);
  });

  router.delete('/me', (req, res, next) => {
    userController.deleteCurrentUser(req as any, res).catch(next);
  });

  return router;
}

