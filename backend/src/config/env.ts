import 'dotenv/config';
import { z } from 'zod';
import { logger } from '@/infra/logger';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z
    .string()
    .min(1, 'JWT_SECRET must be provided')
    .refine(
      val => process.env.NODE_ENV !== 'production' || val.length >= 32,
      'JWT_SECRET must be at least 32 characters in production'
    ),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL must be provided'),
  RESEND_API_KEY: z.string().default(''),
  MASTER_ADMIN_EMAILS: z.string().default(''), // comma-separated list of emails
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  EMAIL_MOCK_MODE: z
    .enum(['true', 'false'])
    .default('true')
    .transform(val => val === 'true'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  logger.error('Invalid environment variables', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

logger.debug('Environment variables successfully validated', {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  emailMockMode: parsedEnv.data.EMAIL_MOCK_MODE,
});

export const env = parsedEnv.data;
