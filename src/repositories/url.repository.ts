import type { Prisma, PrismaClient, ShortUrl } from '@prisma/client';

export class UrlRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: { code: string; originalUrl: string }): Promise<ShortUrl> {
    return this.prisma.shortUrl.create({
      data: {
        code: data.code,
        originalUrl: data.originalUrl
      }
    });
  }

  findByCode(code: string): Promise<ShortUrl | null> {
    return this.prisma.shortUrl.findUnique({
      where: { code }
    });
  }

  async incrementVisits(code: string): Promise<ShortUrl | null> {
    try {
      return await this.prisma.shortUrl.update({
        where: { code },
        data: {
          visits: {
            increment: 1
          }
        }
      });
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        return null;
      }

      throw error;
    }
  }

  private isRecordNotFound(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';
  }
}
