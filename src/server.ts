import { existsSync } from 'node:fs';
import { loadEnv } from './config/env.js';
import { createPrismaClient } from './db/prisma.js';
import { buildApp } from './app.js';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const start = async () => {
  const env = loadEnv();
  const prisma = createPrismaClient();
  const app = await buildApp({
    prisma,
    baseUrl: env.BASE_URL,
    logger: true
  });

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
};

start().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
