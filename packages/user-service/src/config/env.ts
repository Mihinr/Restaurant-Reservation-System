import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Find the .env file in the package directory
// __dirname will be packages/user-service/src/config (or dist/config)
const packageEnvPath = path.resolve(__dirname, '../../.env');

if (!existsSync(packageEnvPath)) {
  throw new Error(`Could not find .env file at: ${packageEnvPath}`);
}

// Use override: true to ensure package-specific .env values override any existing env vars
dotenv.config({ path: packageEnvPath, override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
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
