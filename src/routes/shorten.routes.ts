import type { FastifyInstance } from 'fastify';
import { shortenRequestSchema } from '../schemas/url.schema.js';
import type { UrlService } from '../services/url.service.js';

export const registerShortenRoutes = (app: FastifyInstance, urlService: UrlService) => {
  app.post('/shorten', async (request, reply) => {
    const body = shortenRequestSchema.parse(request.body);
    const result = await urlService.shorten(body.url);

    return reply.status(201).send(result);
  });
};
