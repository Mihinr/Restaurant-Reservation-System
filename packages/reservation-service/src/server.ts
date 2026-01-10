import http from 'http';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { getEnvConfig } from './config/env';
import { logger } from './config/logger';
import { initSocket } from './socket';

const { PORT } = getEnvConfig();
const prisma = new PrismaClient();

// Test database connection
async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

const app = createApp(prisma);
const httpServer = http.createServer(app);
initSocket(httpServer);

let server: http.Server | null = null;

// Connect to database before starting server
connectDatabase()
  .then(() => {
    server = httpServer.listen(PORT, () => {
      logger.info(`Reservation service listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

