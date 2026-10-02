export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const invalidRequest = (message: string, code = 'INVALID_REQUEST') =>
  new AppError(400, code, message);

export const shortUrlNotFound = () =>
  new AppError(404, 'SHORT_URL_NOT_FOUND', 'Short URL not found');
