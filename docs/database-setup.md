# Database Setup Guide

This project uses Docker to automatically spin up a PostgreSQL database when running `pnpm dev`.

## Prerequisites

- Docker installed and running
- pnpm package manager

## Quick Start

Simply run:

```bash
pnpm dev
```

This will:
1. Start the PostgreSQL container in Docker
2. Wait for the database to be ready
3. Run any pending migrations automatically
4. Start the Next.js development server

## Available Scripts

### Development
- `pnpm dev` - Start everything (Docker + migrations + Next.js)
- `pnpm dev:next` - Start only Next.js (if database is already running)

### Docker Management
- `pnpm docker:up` - Start PostgreSQL container
- `pnpm docker:down` - Stop PostgreSQL container
- `pnpm docker:clean` - Stop container and remove all data (fresh start)

### Database Management
- `pnpm db:generate` - Generate migration files from schema changes
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:push` - Push schema changes directly (dev only)
- `pnpm db:studio` - Open Drizzle Studio (database UI)

## Configuration

Database configuration is stored in `.env`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=varuna_carbon_dmrv
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgres://postgres:postgres@localhost:5432/varuna_carbon_dmrv
```

## Database Schema

The database schema is defined in `db/schema.ts`. To make changes:

1. Edit `db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Run migration: `pnpm db:migrate` (or restart `pnpm dev`)

## Data Persistence

Database data persists between Docker restarts using a named volume (`postgres_data`).

To start fresh:
```bash
pnpm docker:clean
pnpm dev
```

## Connection Details

- **Host:** localhost
- **Port:** 5432
- **Database:** varuna_carbon_dmrv
- **Username:** postgres
- **Password:** postgres

You can connect with any PostgreSQL client using these credentials.

## Drizzle Studio

To inspect and manage your database with a visual interface:

```bash
pnpm db:studio
```

This opens Drizzle Studio at `https://local.drizzle.studio`

## Production

For production, use a managed PostgreSQL service (Vercel Postgres, Supabase, Neon, etc.) and set the `DATABASE_URL` environment variable accordingly.
