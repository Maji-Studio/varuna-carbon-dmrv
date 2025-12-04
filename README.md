# Varuna Carbon DMRV

Dark Earth Carbon's Data Management, Reporting, and Verification system for biochar carbon credits following the Isometric Protocol.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (for PostgreSQL)

## Quick Start

1. Clone the repository
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start development (Docker + DB + migrations + seed + Next.js):
   ```bash
   pnpm dev
   ```

The app will be available at http://localhost:3000

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Full dev setup: Docker, migrations, seed data, Next.js server |
| `pnpm dev:quick` | Same as dev but skips seeding (preserves existing data) |
| `pnpm dev:next` | Just Next.js (assumes DB already running) |
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm lint` | Run ESLint |

### Database Scripts

| Script | Description |
|--------|-------------|
| `pnpm db:generate` | Generate migration files from schema changes |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:migrate:prod` | Run migrations (with reminder to check DATABASE_URL) |
| `pnpm db:push` | Push schema directly (dev only, no migration files) |
| `pnpm db:seed` | Seed database with test data |
| `pnpm db:studio` | Open Drizzle Studio GUI |

### Docker Scripts

| Script | Description |
|--------|-------------|
| `pnpm docker:up` | Start PostgreSQL container |
| `pnpm docker:down` | Stop PostgreSQL container |
| `pnpm docker:clean` | Stop container and remove data volume |

## Database Workflow

### Development
Use `db:push` for rapid iteration - it syncs your schema directly without creating migration files.

### Production (Vercel)

**Important:** Run migrations separately from deploys to avoid breaking prod if a build fails.

1. Make schema changes in `src/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Test locally: `pnpm db:migrate`
4. Commit the migration files in `./drizzle`
5. Deploy to Vercel (build only, no auto-migration)
6. Once deploy succeeds, run migration against prod:
   ```bash
   DATABASE_URL=<prod-url> pnpm db:migrate:prod
   ```

**Writing safe migrations:**
- Add columns as nullable or with defaults
- Don't drop/rename columns in the same deploy as code changes
- If breaking changes needed: deploy compatible code → migrate → deploy final code

## Tech Stack

- **Framework:** Next.js 15
- **Database:** PostgreSQL 17
- **ORM:** Drizzle ORM
- **Protocol:** Isometric Protocol v1.2
