# Aquário - Developer Guide

Technical guide for developers working on the Aquário project.

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/ralfferreira/aquario.git
cd aquario
./scripts/setup-submodules.sh

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# 4. Start development
npm run dev
```

**Access:** http://localhost:3000

## Project Structure

```
aquario/
├── src/
│   ├── app/                    # Next.js App Router (pages + API routes)
│   │   ├── api/               # Backend API routes
│   │   └── (pages)/           # Frontend pages
│   ├── components/            # React components
│   └── lib/
│       ├── server/            # Server-only code (DB, services)
│       ├── client/            # Client-only code (hooks, API calls)
│       └── shared/            # Shared types and utilities
├── content/                   # Git submodules (guias, entidades, etc.)
├── prisma/                    # Database schema and migrations
└── tests/                     # E2E tests
```

## Development Modes

### Mode 1: Full Stack (with Database)

Requires Docker for PostgreSQL:

```bash
# Start Docker, then:
docker-compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

### Mode 2: Frontend Only (no Database)

For working on UI without database:

```bash
# In .env.local, set:
DB_PROVIDER=memory
NEXT_PUBLIC_GUIAS_DATA_PROVIDER=local
NEXT_PUBLIC_ENTIDADES_DATA_PROVIDER=local
```

Then `npm run dev` - data comes from git submodules.

## Commands

| Command                    | Description                |
| -------------------------- | -------------------------- |
| `npm run dev`              | Start development server   |
| `npm run build`            | Build for production       |
| `npm run lint`             | Run ESLint                 |
| `npm run format`           | Format with Prettier       |
| `npm run type-check`       | TypeScript check           |
| `npm run check-all`        | Lint + Format + Types      |
| `npm run test`             | Unit tests (Jest)          |
| `npm run test:integration` | Integration tests (Vitest) |
| `npm run test:e2e`         | E2E tests (Playwright)     |
| `npm run db:migrate`       | Run migrations             |
| `npm run db:seed`          | Seed database              |
| `npm run db:studio`        | Open Prisma Studio         |

## Architecture

### Server Code (`src/lib/server/`)

- **`db/`** - Database layer with repository pattern
  - `interfaces/` - Repository interfaces
  - `implementations/prisma/` - PostgreSQL implementation
  - `implementations/memory/` - In-memory implementation (for testing)
- **`services/`** - Business services (email, etc.)
- **`container/`** - Dependency injection container

### Client Code (`src/lib/client/`)

- **`api/`** - API client functions
- **`hooks/`** - React Query hooks
- **`storage/`** - Local storage utilities

### Shared Code (`src/lib/shared/`)

- **`types/`** - TypeScript types used by both server and client
- **`config/`** - Configuration and constants
- **`utils.ts`** - Shared utilities

## Conventions

### File Naming

All files use **kebab-case**: `user-profile.tsx`, `use-auth.ts`

### Code Language

- **Code**: English (variables, functions, comments)
- **UI Text**: Portuguese
- **Commits**: English

### Commit Messages

```
type: short description

feat: add user authentication
fix: resolve login validation error
docs: update README
refactor: simplify auth logic
test: add user API tests
chore: update dependencies
```

## Environment Variables

See `.env.example` for all available variables. Key ones:

| Variable                      | Description                    |
| ----------------------------- | ------------------------------ |
| `DATABASE_URL`                | PostgreSQL connection string   |
| `DB_PROVIDER`                 | `prisma` (real DB) or `memory` |
| `JWT_SECRET`                  | Auth secret (32+ chars)        |
| `EMAIL_MOCK_MODE`             | Skip email verification in dev |
| `NEXT_PUBLIC_*_DATA_PROVIDER` | `local` or `backend`           |

## Git Submodules

Content is managed via git submodules in `content/`:

```bash
# Initialize/update all submodules
./scripts/setup-submodules.sh

# Or manually
git submodule update --init --recursive
```

## Need Help?

- Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Check [TESTING-GUIDE.md](TESTING-GUIDE.md) for testing patterns
- Open an issue or email [ralf.ferreira@academico.ufpb.br](mailto:ralf.ferreira@academico.ufpb.br)
