import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error: FastifyError | Error, _request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: error.issues[0]?.message ?? 'Invalid request'
        }
      });
    }

    if ('code' in error && error.code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
      return reply.status(400).send({
        error: {
          code: 'MALFORMED_JSON',
          message: 'Malformed JSON request body'
        }
      });
    }

    app.log.error(error);

    return reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error'
      }
    });
  });
};
