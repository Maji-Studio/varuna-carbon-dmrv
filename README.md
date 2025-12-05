# Varuna Carbon DMRV

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)](https://www.postgresql.org/)
[![Isometric Protocol](https://img.shields.io/badge/Protocol-Isometric%20v1.2-green)](https://isometric.com/)

An open-source **Data Management, Reporting, and Verification (DMRV)** system for biochar carbon credits, built following the [Isometric Protocol](https://isometric.com/).

## Overview

Varuna Carbon DMRV provides a complete solution for managing biochar carbon removal projects, from project registration through credit issuance. It implements the Isometric Protocol for transparent, verifiable carbon credit tracking.

### Key Features

- **Project Management** - Register and manage biochar carbon removal projects
- **Credit Tracking** - Track carbon credits from creation through issuance
- **Isometric Integration** - Built to comply with Isometric Protocol v1.2
- **Audit Trail** - Complete transparency for verification and auditing

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (for PostgreSQL)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Maji-Studio/varuna-carbon-dmrv.git
   cd varuna-carbon-dmrv
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Start development** (Docker + DB + migrations + seed + Next.js)
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

### Production

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

- **Framework:** [Next.js 15](https://nextjs.org/)
- **Database:** [PostgreSQL 17](https://www.postgresql.org/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Protocol:** [Isometric Protocol v1.2](https://isometric.com/)

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Isometric](https://isometric.com/) for the carbon credit protocol
- [Maji Studio](https://github.com/Maji-Studio) for project development
