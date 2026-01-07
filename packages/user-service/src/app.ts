import express, { Express } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '../node_modules/.prisma/user-service-client';
import { errorHandler } from './middlewares/errorHandler';
import { createAuthRoutes } from './routes/auth.routes';
import { createUserRoutes } from './routes/user.routes';
import { createHealthRoutes } from './routes/health.routes';
import { logger } from './config/logger';

export function createApp(prisma: PrismaClient): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  });

  app.use('/api/v1', limiter);

  app.use('/health', createHealthRoutes(prisma));
  app.use('/api/v1/auth', createAuthRoutes(prisma));
  app.use('/api/v1/users', createUserRoutes(prisma));

  app.use(errorHandler);

  return app;
}

