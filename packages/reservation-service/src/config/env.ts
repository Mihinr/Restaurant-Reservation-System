import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Find the .env file in the package directory
// __dirname will be packages/reservation-service/src/config (or dist/config)
const packageEnvPath = path.resolve(__dirname, '../../.env');

// Load .env file if it exists (for local development)
// In Docker, environment variables are provided via docker-compose, so .env file is optional
if (existsSync(packageEnvPath)) {
  // Use override: true to ensure package-specific .env values override any existing env vars
  dotenv.config({ path: packageEnvPath, override: true });
}
// If .env file doesn't exist, we rely on process.env (which is populated by Docker Compose)

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  TABLE_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig | undefined;

export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    envConfig = envSchema.parse(process.env);
  }
  return envConfig;
}

