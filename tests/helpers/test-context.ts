import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

type TestContext = {
  app: FastifyInstance;
  prisma: PrismaClient;
  cleanup: () => Promise<void>;
};

export const createTestContext = async (): Promise<TestContext> => {
  const dbName = `test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;
  const dbPath = join(process.cwd(), 'prisma', dbName);
  const databaseUrl = `file:./${dbName}`;

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "ShortUrl" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "code" TEXT NOT NULL,
      "originalUrl" TEXT NOT NULL,
      "visits" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX "ShortUrl_code_key" ON "ShortUrl"("code")'
  );

  const app = await buildApp({
    prisma,
    baseUrl: 'http://localhost:3000',
    logger: false
  });

  return {
    app,
    prisma,
    cleanup: async () => {
      await app.close();

      for (const suffix of ['', '-journal', '-shm', '-wal']) {
        const file = `${dbPath}${suffix}`;

        if (existsSync(file)) {
          rmSync(file, { force: true });
        }
      }
    }
  };
};
