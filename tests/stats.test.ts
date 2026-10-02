import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/test-context.js';

let context: Awaited<ReturnType<typeof createTestContext>>;

beforeAll(async () => {
  context = await createTestContext();
});

afterAll(async () => {
  await context?.cleanup();
});

describe('GET /stats/:code', () => {
  it('returns visit count', async () => {
    await context.prisma.shortUrl.create({
      data: {
        code: 'stats01',
        originalUrl: 'https://example.com/stats',
        visits: 5
      }
    });

    const response = await context.app.inject({
      method: 'GET',
      url: '/stats/stats01'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      code: 'stats01',
      url: 'https://example.com/stats',
      visits: 5
    });
  });

  it('returns 404 for an unknown code', async () => {
    const response = await context.app.inject({
      method: 'GET',
      url: '/stats/missing'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: 'SHORT_URL_NOT_FOUND',
        message: 'Short URL not found'
      }
    });
  });

  it('reflects multiple redirects in stats', async () => {
    await context.prisma.shortUrl.create({
      data: {
        code: 'multi01',
        originalUrl: 'https://example.com/multi'
      }
    });

    await context.app.inject({ method: 'GET', url: '/multi01' });
    await context.app.inject({ method: 'GET', url: '/multi01' });

    const response = await context.app.inject({
      method: 'GET',
      url: '/stats/multi01'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().visits).toBe(2);
  });
});
