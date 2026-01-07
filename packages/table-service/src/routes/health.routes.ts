import { Router, Request, Response } from 'express';
import { PrismaClient } from '../node_modules/.prisma/table-service-client';

export function createHealthRoutes(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'table-service',
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/ready', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ready',
        service: 'table-service',
        database: 'connected',
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        service: 'table-service',
        database: 'disconnected',
      });
    }
  });

  return router;
}

