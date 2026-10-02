import type { Prisma } from '@prisma/client';
import { shortUrlNotFound } from '../errors/app-error.js';
import type { UrlRepository } from '../repositories/url.repository.js';
import { generateShortCode } from '../utils/short-code.js';

const MAX_CODE_GENERATION_ATTEMPTS = 5;

export class UrlService {
  constructor(
    private readonly repository: UrlRepository,
    private readonly baseUrl: string
  ) {}

  async shorten(url: string) {
    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      const code = generateShortCode();

      try {
        const shortUrl = await this.repository.create({ code, originalUrl: url });

        return {
          code: shortUrl.code,
          shortUrl: `${this.baseUrl}/${shortUrl.code}`,
          url: shortUrl.originalUrl
        };
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Unable to generate a unique short code');
  }

  async getRedirectUrl(code: string): Promise<string> {
    const shortUrl = await this.repository.incrementVisits(code);

    if (!shortUrl) {
      throw shortUrlNotFound();
    }

    return shortUrl.originalUrl;
  }

  async getStats(code: string) {
    const shortUrl = await this.repository.findByCode(code);

    if (!shortUrl) {
      throw shortUrlNotFound();
    }

    return {
      code: shortUrl.code,
      url: shortUrl.originalUrl,
      visits: shortUrl.visits
    };
  }

  private isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
