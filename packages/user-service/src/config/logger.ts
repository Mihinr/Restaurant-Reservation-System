import winston from 'winston';
import { getCorrelationId } from '@restaurant-reservation/shared/server';
import { getEnvConfig } from './env';

const { LOG_LEVEL } = getEnvConfig();

const injectCorrelationId = winston.format((info) => {
  const correlationId = getCorrelationId();
  if (correlationId) {
    info.correlationId = correlationId;
  }
  return info;
});

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    injectCorrelationId(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

