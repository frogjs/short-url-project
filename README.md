# Short URL API

A small REST API for shortening URLs, similar to a minimal bit.ly-style service. It stores URL mappings in SQLite, redirects by short code, and tracks redirect visits.

## Technology Choices

- Node.js and TypeScript for a strict, maintainable backend.
- Fastify for a small, fast HTTP server with test-friendly request injection.
- SQLite with Prisma ORM for durable local persistence and migrations.
- Zod for request and environment validation.
- Vitest for integration tests.

## Requirements

- Node.js 22 or newer
- npm

## Installation

```bash
npm install
```

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Default values:

```env
PORT=3000
BASE_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```

`BASE_URL` is used when returning the public short URL. `DATABASE_URL` points Prisma to the SQLite database.

## Database Setup

Run the included Prisma migrations:

```bash
npx prisma migrate deploy
```

This creates the SQLite database if it does not already exist. Application database files are ignored by git.

## Development

```bash
npm run dev
```

The API listens on `PORT`, which defaults to `3000`.

## Tests

```bash
npm test
```

Tests run against isolated SQLite databases initialized through Prisma Client. They do not depend on developer data and remove their database files after each suite.

## Production Build

```bash
npm run build
npm start
```

Useful additional check:

```bash
npm run typecheck
```

## API

All error responses use this shape:

```json
{
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Create a Short URL

```bash
curl -i -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/some/very/long/path"}'
```

Response:

```json
{
  "code": "abc1234",
  "shortUrl": "http://localhost:3000/abc1234",
  "url": "https://example.com/some/very/long/path"
}
```

Validation rejects missing fields, non-string values, malformed URLs, URLs longer than 2048 characters, and protocols other than `http` or `https`.

### Redirect

```bash
curl -i http://localhost:3000/abc1234
```

Successful responses return `302` with a `Location` header pointing to the original URL. Each redirect increments the visit counter in the database using Prisma's atomic `increment` operation.

Unknown codes return:

```json
{
  "error": {
    "code": "SHORT_URL_NOT_FOUND",
    "message": "Short URL not found"
  }
}
```

### Stats

```bash
curl -i http://localhost:3000/stats/abc1234
```

Response:

```json
{
  "code": "abc1234",
  "url": "https://example.com/some/very/long/path",
  "visits": 5
}
```

### Health

```bash
curl -i http://localhost:3000/health
```

Response:

```json
{
  "status": "ok"
}
```

## Architecture

The app is organized as a small production service:

- `src/app.ts` builds the Fastify app and wires dependencies.
- `src/server.ts` loads configuration, starts the server, and handles shutdown.
- `src/routes/` contains thin HTTP route handlers.
- `src/services/url.service.ts` contains URL-shortening and redirect business logic.
- `src/repositories/url.repository.ts` isolates Prisma database access.
- `src/schemas/` contains Zod validation.
- `src/errors/` contains consistent application errors and centralized HTTP error handling.
- `prisma/` contains the schema and migration.
- `tests/` contains HTTP-level integration tests.

## Implementation Decisions

- Generated codes are 7-character URL-safe Nano ID strings using digits and letters.
- Identical long URLs are allowed to produce different short codes.
- Code collisions are handled by retrying inserts when the database unique constraint rejects a generated code.
- Visit increments happen at the database level with an atomic increment instead of read-modify-write in application memory.
- The service stores and redirects URLs but does not fetch them, so SSRF defenses are intentionally limited to syntax, length, and protocol validation.
