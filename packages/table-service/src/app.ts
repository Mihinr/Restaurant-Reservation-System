import express, { Express } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { correlationMiddleware } from '@restaurant-reservation/shared/server';
import { errorHandler } from './middlewares/errorHandler';
import { createRestaurantRoutes } from './routes/restaurant.routes';
import { createTableRoutes } from './routes/table.routes';
import { createHealthRoutes } from './routes/health.routes';
import { setupSwagger } from './config/swagger';
import { TableController } from './controllers/table.controller';
import { TableService } from './services/table.service';

export function createApp(prisma: PrismaClient): Express {
  const app = express();

  setupSwagger(app);

  app.use(correlationMiddleware);
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased to handle batch requests from reservation service
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/v1', limiter);

  app.use('/health', createHealthRoutes(prisma));
  app.use('/api/v1/restaurants', createRestaurantRoutes(prisma));
  app.use('/api/v1/restaurants/:restaurantId/tables', createTableRoutes(prisma));
  app.use('/api/v1/tables', createTableRoutes(prisma));

  const tableService = new TableService(prisma);
  const tableController = new TableController(tableService);
  app.get('/api/v1/restaurants/:restaurantId/availability', (req, res, next) => {
    tableController.getAvailability(req, res).catch(next);
  });

  app.use(errorHandler);

  return app;
}

