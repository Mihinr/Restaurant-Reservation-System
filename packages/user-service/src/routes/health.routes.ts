import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export function createHealthRoutes(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  router.get('/ready', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ready',
        service: 'user-service',
        database: 'connected',
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        service: 'user-service',
        database: 'disconnected',
      });
    }
  });

  return router;
}

