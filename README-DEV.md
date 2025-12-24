# Aquário — Developer Guide

Technical documentation for developers working on the Aquário project.

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/aquario-ufpb/aquario.git
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

---

## Development Modes

### Full Stack (with Database)

Requires Docker for PostgreSQL:

```bash
docker-compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

### Frontend Only (no Database)

For working on UI without database setup:

```bash
# In .env.local:
DB_PROVIDER=memory
NEXT_PUBLIC_GUIAS_DATA_PROVIDER=local
NEXT_PUBLIC_ENTIDADES_DATA_PROVIDER=local
```

Then run `npm run dev` — data comes from git submodules.

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
├── tests/                     # E2E tests
└── docs/                      # Additional documentation
```

---

## Commands Reference

### Development

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

### Database

| Command | Description |
| ------- | ----------- |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database |

### Code Quality

| Command | Description |
| ------- | ----------- |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run type-check` | TypeScript check |
| `npm run check-all` | **Run all checks** (lint + format + types) |

### Testing

| Command | Description |
| ------- | ----------- |
| `npm run test` | Unit tests (Jest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with coverage |
| `npm run test:integration` | Integration tests (Vitest) |
| `npm run test:integration:ui` | Integration tests with UI |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run test:e2e:ui` | E2E tests with UI |
| `npm run test:all` | Run all test suites |

### Versioning

| Command | Description |
| ------- | ----------- |
| `npm run release:patch` | Bump patch version (1.0.0 → 1.0.1) |
| `npm run release:minor` | Bump minor version (1.0.0 → 1.1.0) |
| `npm run release:major` | Bump major version (1.0.0 → 2.0.0) |

---

## Testing Guide

### Test Types

| Type | Framework | Purpose | Location |
| ---- | --------- | ------- | -------- |
| **Unit** | Jest | Pure functions, utilities | `src/**/__tests__/*.test.ts` |
| **Integration** | Vitest | React hooks, components | `src/**/__tests__/*.integration.test.tsx` |
| **E2E** | Playwright | Full user flows | `tests/e2e/*.e2e.test.ts` |

### Writing Tests

**Unit Tests (Jest):**

```typescript
// src/lib/shared/__tests__/my-utils.test.ts
describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

**Integration Tests (Vitest):**

```typescript
// src/lib/client/hooks/__tests__/use-data.integration.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryWrapper } from '@/__tests__/utils/test-providers';

describe('useData', () => {
  it('should fetch data successfully', async () => {
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
import { test, expect } from '@playwright/test';

test('should complete user flow', async ({ page }) => {
  await page.goto('/feature');
  await page.click('button:has-text("Submit")');
  await expect(page.locator('.success')).toBeVisible();
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

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string |
| `DB_PROVIDER` | `prisma` (real DB) or `memory` |
| `JWT_SECRET` | Auth secret (32+ chars) |
| `EMAIL_MOCK_MODE` | Skip email verification in dev |
| `NEXT_PUBLIC_*_DATA_PROVIDER` | `local` or `backend` |

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

1. Update `CHANGELOG.md` with your changes
2. Run the appropriate release command:
   ```bash
   npm run release:patch  # Bug fixes
   npm run release:minor  # New features
   npm run release:major  # Breaking changes
   ```
3. Push the tag: `git push origin --tags`
4. Create a GitHub Release from the tag

---

## Need Help?

- 📖 Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- 💬 Open an issue on GitHub
- 📧 Email: [aquarioufpb@gmail.com](mailto:aquarioufpb@gmail.com)
