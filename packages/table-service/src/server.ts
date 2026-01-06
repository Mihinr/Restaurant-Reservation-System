import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { getEnvConfig } from './config/env';
import { logger } from './config/logger';

const { PORT } = getEnvConfig();
const prisma = new PrismaClient();

const app = createApp(prisma);

const server = app.listen(PORT, () => {
  logger.info(`Table service listening on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

