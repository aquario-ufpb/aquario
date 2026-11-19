# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Complementary to `.claude/CLAUDE.md` (stack overview, domain glossary in Portuguese, changelog rule). Read that too; this file covers commands and architecture details that need cross-file context. Where they disagree, trust the code.

## Commands

```bash
npm run setup                 # first-time: submodules, Docker Postgres, migrations (copy .env.example -> .env first)
npm run dev                   # Next dev server (localhost:3000)
npm run check-all             # lint + prettier check + tsc --noEmit (what CI runs)
npm run format                # prettier --write .

npm run test                  # Jest (unit, jsdom)
npx jest path/to/file.test.ts           # single Jest file
npx jest -t "nome do teste"             # single Jest test by name
npm run test:integration      # Vitest (happy-dom), only *.integration.test.{ts,tsx}
npx vitest run path/to/file.integration.test.ts   # single Vitest file
npm run test:sigaa-db         # SIGAA DB tests; spins up a disposable local Postgres (Docker), refuses any DB not named aquario_sigaa_test[_x]
npm run verify:sigaa-boundary # static check of prisma/schema.prisma (see SIGAA below)

npm run db:migrate           # also: db:seed, db:studio, db:reset, db:generate
```

- Jest and Vitest split by filename: `*.integration.test.ts(x)` is Vitest only; everything else under `src/**` (`__tests__/` dirs or `*.test.ts`) is Jest. Both resolve `@/` to `src/` and `@/content/` to `content/`.
- `npm run build` runs `scripts/build-with-migrations.js` (applies migrations, then `next build`), not plain `next build`.
- Husky + lint-staged run `prettier --write` on commit. Node 22 in CI.

## Architecture

### Layering (`src/lib/{client,server,shared}`)
`client/` is browser-only, `server/` is Node-only, `shared/` is imported by both (types, error codes, config constants). Never import `server/` from client code.

### API routes: plain handlers, not `createApiHandler`
Routes in `src/app/api/**/route.ts` export plain `GET/POST/...` functions (usually with `export const dynamic = "force-dynamic"`). The pattern actually in use:
- Wrap authenticated handlers in `withAuth(request, async (req, usuario) => ...)` from `@/lib/server/services/auth/middleware` (also has role/permission helpers like `canManageVagaForEntidade`).
- Validate bodies with Zod schemas from `src/lib/server/api-schemas/*`, convert failures with `fromZodError`.
- Return errors with `ApiError.*` / `handleError` from `@/lib/server/errors` (codes live in `src/lib/shared/errors`).
- Request/response schemas are also registered for the OpenAPI doc served by `src/app/api/openapi` (`src/lib/server/openapi/` using zod-to-openapi); update the matching `paths/` file when changing an endpoint's contract.

### Data access
All DB access goes through repositories resolved by `getContainer()` (`src/lib/server/container`): interfaces in `server/db/interfaces`, Prisma implementations in `server/db/implementations/prisma`. The container is a lazy singleton. Business logic that spans repositories lives in `server/services/*` (auth, jwt, email, blob, calendario, planner, sigaa, academic-import, admin, rate-limit, audit-log).

### Frontend data flow
Pages in `src/app/**` use feature components in `src/components/<feature>`; server state via TanStack Query with keys centralised in `src/lib/client/query-keys.ts`; HTTP via service functions in `src/lib/client/api/*` that call `apiClient` (auto base URL, JWT, refresh-on-401) and `throwApiError`.

### Content submodules
`content/aquario-guias`, `content/aquario-entidades`, `content/aquario-mapas` are git submodules (content repos, bumped by the `update-*-submodule.yml` workflows). Clone/init with `npm run setup` or `git submodule update --init`. Jest mocks the mapas `professores` module (`src/lib/client/mapas/__mocks__`). `scripts/import-entidade.ts` and the `import-entidade.yml` workflow import entity data from the content repo into the DB.

### SIGAA integration (privacy-critical)
Student academic data is synced through an external private connector (`SIGAA_CONNECTOR_*` env vars, server-only; see `.env.example` and `src/lib/server/config/sigaa-env.ts`). Hard rules enforced by `scripts/verify-sigaa-boundary.mjs` (run by CI via `code-quality.yml`):
- Prisma may only contain exactly these `Sigaa*` models: `SigaaAcademicSnapshot`, `SigaaConnection`, `SigaaCourseChangeProposal`, `SigaaRateLimitBucket`, `SigaaSyncRun`.
- No field in them may match credentials/raw-content names (password, username, cookie, html, pdf, viewstate, raw body/error/response, bearer…). Never persist SIGAA credentials or raw responses.
- Never set connector URL/secret for Preview deployments; `SIGAA_REAUTH_JWT_SECRET` and `CRON_SECRET` must differ from `JWT_SECRET`.
Adding a SIGAA model requires updating the allow-list in that script deliberately.

The planner (`/planejador`, `server/services/planner`, `client/planner`) parses SIGAA offerings and keeps private plans per user.

### Environments
Smart defaults: no `RESEND_API_KEY` → emails are logged and users auto-verified; no PostHog key or dev mode → analytics off. See `README-DEV.md`.
