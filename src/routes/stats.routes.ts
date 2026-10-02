import type { FastifyInstance } from 'fastify';
import type { UrlService } from '../services/url.service.js';

type CodeParams = {
  code: string;
};

export const registerStatsRoutes = (app: FastifyInstance, urlService: UrlService) => {
  app.get<{ Params: CodeParams }>('/stats/:code', async (request) => {
    return urlService.getStats(request.params.code);
  });
};
