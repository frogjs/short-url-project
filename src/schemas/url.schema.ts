import { z } from 'zod';

const MAX_URL_LENGTH = 2048;

export const shortenRequestSchema = z.object({
  url: z
    .string({
      error: (issue) => (issue.input === undefined ? 'url is required' : 'url must be a string')
    })
    .trim()
    .min(1, 'url is required')
    .max(MAX_URL_LENGTH, `url must be at most ${MAX_URL_LENGTH} characters`)
    .superRefine((value, context) => {
      let parsedUrl: URL;

      try {
        parsedUrl = new URL(value);
      } catch {
        context.addIssue({
          code: 'custom',
          message: 'url must be a valid URL'
        });
        return;
      }

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        context.addIssue({
          code: 'custom',
          message: 'url must use http or https'
        });
      }
    })
});

export type ShortenRequest = z.infer<typeof shortenRequestSchema>;
