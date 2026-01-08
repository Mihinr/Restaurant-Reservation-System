import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';
import { authenticate } from '../middlewares/auth.middleware';

export function createAuthRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const authService = new AuthService(prisma);
  const authController = new AuthController(authService);

  router.post('/register', validate(registerSchema), (req, res, next) => {
    authController.register(req as any, res).catch(next);
  });

  router.post('/login', validate(loginSchema), (req, res, next) => {
    authController.login(req as any, res).catch(next);
  });

  router.post('/refresh', validate(refreshTokenSchema), (req, res, next) => {
    authController.refresh(req as any, res).catch(next);
  });

  router.post('/logout', authenticate, (req, res, next) => {
    authController.logout(req as any, res).catch(next);
  });

  return router;
}

