import type { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';
import { registerErrorHandler } from './errors/error-handler.js';
import { UrlRepository } from './repositories/url.repository.js';
import { registerRedirectRoutes } from './routes/redirect.routes.js';
import { registerShortenRoutes } from './routes/shorten.routes.js';
import { registerStatsRoutes } from './routes/stats.routes.js';
import { UrlService } from './services/url.service.js';

type BuildAppOptions = {
  prisma: PrismaClient;
  baseUrl: string;
  logger?: boolean;
};

export const buildApp = async ({ prisma, baseUrl, logger = true }: BuildAppOptions) => {
  const app = Fastify({ logger });
  const repository = new UrlRepository(prisma);
  const urlService = new UrlService(repository, baseUrl);

  registerErrorHandler(app);

  app.get('/health', async () => ({ status: 'ok' }));

  registerShortenRoutes(app, urlService);
  registerStatsRoutes(app, urlService);
  registerRedirectRoutes(app, urlService);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
};
