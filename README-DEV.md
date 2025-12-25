# Aquário — Developer Guide

Technical documentation for developers working on the Aquário project.

## Quick Start

**Prerequisites:**
- Node.js 18+ and npm installed ([Download Node.js](https://nodejs.org/))
- Docker (optional, for local database) or cloud database

```bash
# 1. Clone repository
git clone https://github.com/aquario-ufpb/aquario.git
cd aquario

# 2. Install dependencies
npm install

# 3. Configure environment (required before setup)
cp .env.example .env
# Edit .env if needed (default works with Docker)

# 4. Run setup (submodules, Docker, migrations)
npm run setup

# 5. Start development
npm run dev
```

**Access:** http://localhost:3000

> 💡 **Tip:** `npm run setup` handles everything - git submodules, Docker database, and migrations. Safe to run multiple times!
> 
> **Note:** Copy `.env.example` to `.env` **before** running `npm run setup` so it can detect your database configuration.

---

## Environments

This is an open-source project with different environment configurations:

| Environment | Who             | Database               | Email          | Analytics |
| ----------- | --------------- | ---------------------- | -------------- | --------- |
| **Dev**     | Anyone          | Local Docker or Memory | Mock (console) | Disabled  |
| **Staging** | Project members | Neon (cloud)           | Resend         | Enabled   |
| **Prod**    | Production      | Neon (cloud)           | Resend         | Enabled   |

### Smart Defaults

The app automatically configures itself based on what's present:

| If this is set...                      | Behavior                                    |
| -------------------------------------- | ------------------------------------------- |
| `DATABASE_URL`                         | Uses PostgreSQL via Prisma                  |
| No `DATABASE_URL`                      | Uses in-memory database                     |
| `RESEND_API_KEY`                       | Sends real emails via Resend                |
| No `RESEND_API_KEY`                    | Logs emails to console, auto-verifies users |
| `NEXT_PUBLIC_POSTHOG_KEY` + production | Tracks analytics                            |
| No PostHog key or dev mode             | Analytics disabled                          |

---

## Development Modes

### Option 1: Full Stack (Recommended)

Uses Docker for a local PostgreSQL database:

```bash
# Start database
docker-compose up -d

# Setup database
npm run db:migrate
npm run db:seed

# Start app
npm run dev
```

Your `.env`:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/aquario"
JWT_SECRET="your-secret-key-at-least-32-characters-long"
# Leave RESEND_API_KEY empty for mock emails
```

### Option 2: Memory Mode (Testing Only)

For testing without a database (no entidades data):

```bash
# In .env:
DB_PROVIDER=memory
NEXT_PUBLIC_GUIAS_DATA_PROVIDER=local
JWT_SECRET="any-32-character-secret-for-dev"
```

Then just `npm run dev`.

**Note:** Entidades always come from the backend API. With memory mode, the in-memory repository starts empty. For actual entidades data, use Option 1 with a seeded database.

### Option 3: Connected to Staging

For project members who need to test with real services:

```bash
# In .env:
DATABASE_URL="postgresql://...@neon.tech/aquario"
RESEND_API_KEY="re_xxx"
JWT_SECRET="staging-secret"
```

---

## Project Structure

```
aquario/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # Backend API routes
│   │   └── (pages)/           # Frontend pages
│   ├── components/            # React components
│   │   ├── pages/            # Page-specific components
│   │   ├── shared/           # Reusable components
│   │   └── ui/               # shadcn/ui components
│   └── lib/
│       ├── server/            # Server-only code
│       │   ├── db/           # Repository pattern (Prisma + Memory)
│       │   ├── services/     # Business logic
│       │   └── container/    # Dependency injection
│       ├── client/            # Client-only code
│       │   ├── api/          # API client functions
│       │   └── hooks/        # React Query hooks
│       └── shared/            # Shared types and utilities
├── content/                   # Git submodules (guias, entidades, etc.)
├── prisma/                    # Database schema and migrations
└── tests/                     # E2E tests
```

---

## Commands Reference

### Development

| Command         | Description                                    |
| --------------- | ---------------------------------------------- |
| `npm run setup` | **First-time setup** (submodules, Docker, DB) |
| `npm run dev`   | Start development server                       |
| `npm run build` | Build for production                           |
| `npm run start` | Start production server                        |

### Database

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `npm run db:migrate`       | Run migrations (development)             |
| `npm run db:migrate:deploy` | Deploy migrations (production)          |
| `npm run db:seed`          | Seed database                            |
| `npm run db:studio`        | Open Prisma Studio                       |
| `npm run db:reset`        | Reset database                           |

> 💡 **Tip:** Run `npm run setup` to automatically handle submodules, Docker, and migrations!

### Code Quality

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run lint`         | Run ESLint                                 |
| `npm run lint:fix`     | Auto-fix lint issues                       |
| `npm run format`       | Format with Prettier                       |
| `npm run format:check` | Check formatting                           |
| `npm run type-check`   | TypeScript check                           |
| `npm run check-all`    | **Run all checks** (lint + format + types) |

### Testing

| Command                       | Description                |
| ----------------------------- | -------------------------- |
| `npm run test`                | Unit tests (Jest)          |
| `npm run test:watch`          | Unit tests in watch mode   |
| `npm run test:coverage`       | Unit tests with coverage   |
| `npm run test:integration`    | Integration tests (Vitest) |
| `npm run test:integration:ui` | Integration tests with UI  |
| `npm run test:e2e`            | E2E tests (Playwright)     |
| `npm run test:e2e:ui`         | E2E tests with UI          |
| `npm run test:all`            | Run all test suites        |

### Versioning

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `npm run release:patch` | Bump patch version (1.0.0 → 1.0.1) |
| `npm run release:minor` | Bump minor version (1.0.0 → 1.1.0) |
| `npm run release:major` | Bump major version (1.0.0 → 2.0.0) |

---

## Environment Variables

See `.env.example` for the complete list with detailed comments.

### Required Variables

| Variable     | Description                                          |
| ------------ | ---------------------------------------------------- |
| `JWT_SECRET` | Auth secret (32+ chars) — **required for all modes** |

### Database

| Variable       | Description                     |
| -------------- | ------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string    |
| `DB_PROVIDER`  | Force `prisma` or `memory` mode |

### Email

| Variable         | Description                        |
| ---------------- | ---------------------------------- |
| `RESEND_API_KEY` | Resend API key (empty = mock mode) |
| `EMAIL_FROM`     | Sender email address               |

### Data Providers

| Variable                          | Description                             |
| --------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_GUIAS_DATA_PROVIDER` | `local` (submodules) or `backend` (API) |

**Note:** Entidades always use the backend API. Data is seeded from submodules into the database.

### Analytics

| Variable                  | Description                            |
| ------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key (empty = disabled) |

---

## Testing Guide

### Test Types

| Type            | Framework  | Purpose                   | Location                                  |
| --------------- | ---------- | ------------------------- | ----------------------------------------- |
| **Unit**        | Jest       | Pure functions, utilities | `src/**/__tests__/*.test.ts`              |
| **Integration** | Vitest     | React hooks, components   | `src/**/__tests__/*.integration.test.tsx` |
| **E2E**         | Playwright | Full user flows           | `tests/e2e/*.e2e.test.ts`                 |

### Writing Tests

**Unit Tests (Jest):**

```typescript
// src/lib/shared/__tests__/my-utils.test.ts
describe("myFunction", () => {
  it("should return expected result", () => {
    expect(myFunction("input")).toBe("expected");
  });
});
```

**Integration Tests (Vitest):**

```typescript
// src/lib/client/hooks/__tests__/use-data.integration.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { createTestQueryWrapper } from "@/__tests__/utils/test-providers";

describe("useData", () => {
  it("should fetch data successfully", async () => {
    const { result } = renderHook(() => useData(), {
      wrapper: createTestQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

**E2E Tests (Playwright):**

```typescript
// tests/e2e/feature.e2e.test.ts
import { test, expect } from "@playwright/test";

test("should complete user flow", async ({ page }) => {
  await page.goto("/feature");
  await page.click('button:has-text("Submit")');
  await expect(page.locator(".success")).toBeVisible();
});
```

---

## Code Style

### Tools

- **Prettier** — Code formatting
- **ESLint** — Linting
- **TypeScript** — Type checking

### File Naming

All files use **kebab-case**:

```
✅ user-profile.tsx
✅ use-auth.ts
❌ UserProfile.tsx
❌ useAuth.ts
```

### Prettier Config

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### VS Code Setup

Recommended extensions:

- Prettier - Code formatter
- ESLint

Settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

---

## Git Submodules

Content is managed via git submodules in `content/`:

```bash
# Initialize/update all submodules
./scripts/setup-submodules.sh

# Or manually
git submodule update --init --recursive
```

---

## Releasing New Versions

1. Update `CHANGELOG.md` with your changes under `[Unreleased]`
2. Run the appropriate release command:
   ```bash
   npm run release:patch  # Bug fixes (1.0.0 → 1.0.1)
   npm run release:minor  # New features (1.0.0 → 1.1.0)
   npm run release:major  # Breaking changes (1.0.0 → 2.0.0)
   ```
3. Push the tag: `git push origin --tags`
4. Create a GitHub Release from the tag

---

## Production Deployment

### Database Migrations

**Good news:** Migrations run automatically during `npm run build` if `DATABASE_URL` is set!

The build script (`scripts/build-with-migrations.js`) will:
- ✅ Always generate Prisma Client
- ✅ Run migrations if `DATABASE_URL` is set (production/staging)
- ✅ Skip migrations if `DATABASE_URL` is not set (frontend-only mode)
- ✅ Always build the Next.js app

**For Vercel:** Just use the default build command (`npm run build`) - migrations will run automatically if you have `DATABASE_URL` configured in your environment variables.

**Manual migration (if needed):**

```bash
npm run db:migrate:deploy
```

**Note:** `prisma migrate deploy` is safe for production - it only applies pending migrations and won't create new ones.

---

## Need Help?

- 📖 Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- 💬 Open an issue on GitHub
- 📧 Email: [aquarioufpb@gmail.com](mailto:aquarioufpb@gmail.com)
