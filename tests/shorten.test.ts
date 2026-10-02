import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/test-context.js';

let context: Awaited<ReturnType<typeof createTestContext>>;

beforeAll(async () => {
  context = await createTestContext();
});

afterAll(async () => {
  await context?.cleanup();
});

describe('POST /shorten', () => {
  it('successfully creates a short URL', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/shorten',
      payload: {
        url: 'https://example.com/some/very/long/path'
      }
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body).toMatchObject({
      shortUrl: expect.stringMatching(/^http:\/\/localhost:3000\/[0-9A-Za-z]{7}$/),
      url: 'https://example.com/some/very/long/path'
    });
    expect(body.code).toMatch(/^[0-9A-Za-z]{7}$/);

    const stored = await context.prisma.shortUrl.findUnique({
      where: { code: body.code }
    });

    expect(stored?.originalUrl).toBe('https://example.com/some/very/long/path');
    expect(stored?.visits).toBe(0);
  });

  it('rejects missing url', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/shorten',
      payload: {}
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'INVALID_REQUEST',
        message: 'url is required'
      }
    });
  });

  it('rejects malformed URL', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/shorten',
      payload: {
        url: 'not-a-url'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');
  });

  it('rejects unsupported protocol', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/shorten',
      payload: {
        url: 'ftp://example.com/file.txt'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'INVALID_REQUEST',
        message: 'url must use http or https'
      }
    });
  });

  it('rejects malformed JSON', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/shorten',
      headers: {
        'content-type': 'application/json'
      },
      payload: '{"url":'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON request body'
      }
    });
  });
});
