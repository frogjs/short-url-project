import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/test-context.js';

let context: Awaited<ReturnType<typeof createTestContext>>;

beforeAll(async () => {
  context = await createTestContext();
});

afterAll(async () => {
  await context?.cleanup();
});

describe('GET /:code', () => {
  it('redirects for a valid code', async () => {
    await context.prisma.shortUrl.create({
      data: {
        code: 'abc1234',
        originalUrl: 'https://example.com/path'
      }
    });

    const response = await context.app.inject({
      method: 'GET',
      url: '/abc1234'
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('https://example.com/path');
  });

  it('returns 404 for an unknown code', async () => {
    const response = await context.app.inject({
      method: 'GET',
      url: '/missing'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: 'SHORT_URL_NOT_FOUND',
        message: 'Short URL not found'
      }
    });
  });

  it('increments visit count safely for each redirect', async () => {
    await context.prisma.shortUrl.create({
      data: {
        code: 'visits1',
        originalUrl: 'https://example.com/visits'
      }
    });

    await context.app.inject({ method: 'GET', url: '/visits1' });
    await context.app.inject({ method: 'GET', url: '/visits1' });
    await context.app.inject({ method: 'GET', url: '/visits1' });

    const stored = await context.prisma.shortUrl.findUniqueOrThrow({
      where: { code: 'visits1' }
    });

    expect(stored.visits).toBe(3);
  });
});
