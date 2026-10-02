import type { FastifyInstance } from 'fastify';
import type { UrlService } from '../services/url.service.js';

type CodeParams = {
  code: string;
};

export const registerRedirectRoutes = (app: FastifyInstance, urlService: UrlService) => {
  app.get<{ Params: CodeParams }>('/:code', async (request, reply) => {
    const targetUrl = await urlService.getRedirectUrl(request.params.code);

    return reply.redirect(targetUrl, 302);
  });
};
