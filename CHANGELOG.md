# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Navigation**: Add `Projetos` link to the desktop navbar and mobile hamburger menu.
- **Landing Page**: Add a "Projetos destaque" section inside the underwater area, above Recursos — an infinite-loop carousel showing 3 cards at a time, drawn from a random sample of the top projects by author count.
- **Projeto Page**: New "Projetos similares" section on `/projetos/[slug]` — shows up to 4 related projetos. Powered by a new `GET /api/projetos/[slug]/similar` endpoint that ranks PUBLICADO projetos server-side by shared autores (entidade > usuário) and tag overlap.

### Changed
- **Projetos**: Default ordering on `/projetos` now uses `dataInicio` (start date) instead of `criadoEm`, falling back to `criadoEm` for projects without a start date.
- **Landing Page**: Bump the GitHub stars stat to 80.
- **Sobre**: Refresh the Funcionalidades copy for semestre 2026.1 — list every live module (Guias, Entidades, Projetos, Vagas, Minhas Disciplinas, Grades Curriculares, Calendário Acadêmico, Mapas, busca global) and drop Vagas from the "em breve" list now that it's live.

### Fixed
- **Entidade**: Members table now scrolls horizontally instead of squeezing the Usuário column when a row enters edit mode. The user column has a guaranteed min-width and the table grows to fit the inline edit controls.
- **DatePicker**: Date picker popovers no longer fail to open when used inside dialogs (e.g. add-member form on entidade page, add-vínculo dialog on profile). Popover now runs in modal mode so the parent Dialog's focus trap doesn't immediately close it.
- **Projeto Page**: "Voltar" button on `/projetos/[id]` now returns to the previous page (e.g. the entidade page the user came from) instead of always going to `/projetos`. Falls back to `/projetos` when there's no in-app history.

## [1.7.0] - 2026-05-02

### Added
- **Projetos**: New `/projetos` feature — create, edit, publish/unpublish, archive, and delete projects with cover image, markdown body (Tiptap editor with image + link upload), tags, period, and external links.
- **Projetos**: Multi-author model — each `ProjetoAutor` references a `usuario`, an `entidade`, or both, with one `autorPrincipal`. Authorship grants edit access; entidade admins inherit it.
- **Projetos**: Listing page with search (titulo/subtitulo/tags), tipo filter, sort (recent/title/author count), and status tabs (`Publicados`, `Meus Publicados`, `Rascunhos`, `Arquivados`). Profile and entidade pages get the same status tabs for owners/admins.
- **Projetos**: Server-side authorization on every mutating route; non-`PUBLICADO` listings are auto-scoped to the caller.
- **Projetos**: Initial set of curated projects seeded from `content/aquario-projetos/projetos.csv`.

### Changed
- **ConfirmDeleteDialog**: Generalized — now accepts custom labels and a non-destructive variant.

## [1.6.0] - 2026-04-26

### Added

### Changed
- **Landing Page**: Replace animated gradient/blob hero with a cleaner static layout, animated wave divider, blue underwater feature section, and deep-water footer.
- **Navigation**: Redesign the desktop nav bar with a cleaner top-bar layout, compact resources menu, and static positioning on the landing page.
- **Navigation**: Align the desktop navbar width and horizontal padding with the main page content.
- **Search**: Show entity logos in command palette search results when available.
- **Sobre**: Restyle the about page to match the cleaner underwater landing page visual system.
- **Landing Page**: Replace the feature screenshots with an illustrated resources grid, including rotating real group logos and a lab map preview.
- **Landing Page**: Split the feature grid into focused card and illustration components.
- **Landing Page**: Lower the underwater wave divider slightly for a softer transition into the feature section.
- **Landing Page**: Animate the laboratory illustration as a rotating lab directory that randomizes through all labs in a loop.
- **Landing Page**: Add a Sobre section below the resources grid with a concise project introduction and live community stats.
- **Landing Page**: Align the underwater background color with the main title brand color.
- **Theme**: Align the global default page background with the landing and about pages.
- **Recursos**: Rename the resources overview route to `/recursos` across navigation, search, and landing links.
- **Recursos**: Reuse feature illustrations on the resources overview page and add a dedicated Minhas Disciplinas illustration.
- **Recursos**: Adapt shared feature illustrations for white resource cards while preserving the underwater landing style.

### Removed
- **Landing Page**: Remove the unused legacy `FeatureSection` component after replacing it with the feature card grid.

### Fixed
- **API Docs**: Align the `/search` OpenAPI response schema with the actual per-category search result payloads.
- **Analytics**: Add location metadata to landing page GitHub CTA tracking events.
- **Landing Page**: Make the underwater wave transition animation track section-relative scroll progress.
- **Search**: Prevent unsupported external entity logo URLs from being passed to `next/image`.
- **Search**: Add accessible labels, focus trapping, and a non-focusable backdrop to the command palette dialog.

## [1.5.1] - 2026-04-25

### Fixed
- **API Docs**: Add `/api` prefix to OpenAPI server URLs so "Try it out" requests in Scalar hit the correct endpoints (e.g. `/api/vagas` instead of `/vagas`)

## [1.5.0] - 2026-04-25

### Added
- **API Docs**: Interactive OpenAPI 3.1 documentation rendered with Scalar UI at `/api-docs`, covering all 56 API endpoints with request/response schemas, examples, and error codes (#149)
- **API Docs**: JSON spec endpoint at `GET /api/openapi` for tooling integration (Postman, Insomnia, SDK generators)
- **Auth**: Expand email validation to support all `.ufpb.br` subdomains (#181)
- **Tests**: Server-side auth service tests — authenticate, register, verify-email, reset-password, forgot-password, resend-verification, and middleware (66 new tests)
- **Tests**: Admin mutation tests — merge-facade-user service (12 tests), user deletion route, role update route, entity member add/update/delete routes (33 tests)
- **Tests**: Onboarding state machine integration tests — step ordering, conditional visibility, PAAS availability, semester-based logic, completion/skip mutations (18 tests)
- **Grades Curriculares**: Botão para exportar grade curricular como imagem PNG — "Com meu progresso" (barra de progresso e stats) e "Grade limpa" (#169)
- **UI**: DatePicker component with Calendar popover, pt-BR locale, and date range constraints
- **Search**: Global search command palette (Ctrl+K) with unified search across pages, guides, entities, jobs, disciplines, courses, and user profiles
- **Search**: PostgreSQL Full-Text Search with `unaccent` extension for accent-insensitive Brazilian Portuguese search, ranked by relevance with `ts_rank`
- **Search**: Recent search history stored in localStorage (up to 8 items)

### Changed
- **API**: Extract Zod validation schemas from route handlers into `src/lib/server/api-schemas/` for Next.js 15 App Router compatibility
- **Onboarding**: Hide onboarding entirely when between semesters — only show it when today falls within an active semester's date range
- **UI**: Replace native date inputs with DatePicker across all forms — entities, memberships, vagas, and calendar management (#167)
- **Dev Tools**: Add open/close animation and unify toggle button (#185)
- **Users**: Otimiza verificação de unicidade de slug em `prisma-usuarios-repository.ts`, limitando a consulta de existência a `select: { id: true }` para reduzir payload por iteração.

### Removed
- **Submodule**: Remove `aquario-vagas` git submodule and all references (repo was deleted). Vagas now fully served via backend API

### Fixed
- **CI**: Skip preview deployment for fork PRs to avoid failures from missing secrets
- **Search**: Sanitize `limit` query parameter as bounded integer to prevent invalid SQL LIMIT values
- **Search**: Guard against null `entidade.slug` to prevent navigation to `/entidade/null`
- **Search**: Fix Prettier formatting and ESLint curly-brace violations across search files
- **Calendário**: Fix exported calendar image for classes spanning multiple time slots — blocks now correctly occupy their full height instead of being clipped to a single row
- **Calendário**: Fix inconsistent time label font sizes in exported calendar image caused by unreset Canvas font state

## [1.4.0] - 2026-03-08

### Added
- **Dev Experience**: Pre-commit hook (via husky + lint-staged) auto-formats staged files with Prettier and fixes ESLint issues; pre-push hook runs `check-all` (lint, format check, type check) before pushing
- **Docs**: `REPLICANDO_NA_SUA_UNIVERSIDADE.md` — comprehensive guide for deploying Aquario at other universities, covering all external services (Vercel, Neon, Resend, PostHog, UptimeRobot), CI/CD setup, content adaptation, and branding customization
- **Dev Tools**: Entity admin toggle — select any entity and become/stop being its admin via dedicated `/api/dev/toggle-entidade-admin` endpoint
- **PostHog Analytics**: Expanded event tracking across all major user flows
  - **Auth flows**: `login_attempted`, `login_succeeded`, `login_failed` (with error type), `register_attempted`, `register_succeeded`, `register_failed`, `forgot_password_submitted`, `reset_password_submitted`, `reset_password_succeeded`, `email_verification_succeeded`, `email_verification_resent`
  - **Onboarding**: `onboarding_step_viewed`, `onboarding_step_completed`, `onboarding_step_skipped` (with `step_id`) — tracked in `OnboardingModal`
  - **Sobre**: `sobre_contact_clicked` via new `ContactButton` client component (page stays a server component)
  - **Mapas**: `mapa_room_clicked` (with `room_name` and `building_name`)
  - **Calendário Acadêmico**: `calendario_academico_view_changed` (lista/calendário toggle), `calendario_academico_semestre_changed`
  - **Grades Curriculares**: `grade_curricular_curso_selected` (with `curso_nome`)
  - **Entidades**: `entidade_detail_viewed` (with `entidade_name` and `entidade_type`) on `/entidade/[slug]`
  - **Usuários**: `usuario_profile_viewed` (with `user_slug`) on `/usuarios/[slug]`, only fires for other users' profiles

### Changed
- **Vagas — Nova Vaga**: Logos das entidades exibidos no dropdown de seleção na criação de vagas
- **Vagas page**: Added list/grid view mode toggle next to search bar; grid mode renders cards in 3-column layout matching the entidades page style
- **VacancyCard**: Standardized badges to use `Badge variant="outline"` with muted styling matching entity cards; added `variant` prop supporting `"list"` and `"grid"` display modes
- **Vaga detail page**: Redesigned to match the entidade detail page layout — ghost back button, hero section with entity name as primary identifier, inline meta info (date, deadline, salary), areas as badges, sections with `border-t` separators, and compact "other vagas" grid

## [1.3.0] - 2026-02-21


### Added
- **Onboarding System**: Multi-step wizard modal that guides new users through setting up their academic profile
  - 7-step flow: Welcome, Período Atual, Disciplinas Concluídas, Disciplinas do Semestre, Turmas, Entidades, Tudo Pronto
  - "Período Atual" step lets users pick their current semester (1–12, 12+, or "Já estou graduado") via button grid
  - `periodoAtual` string field on Usuario model, `PATCH /api/usuarios/me/periodo` endpoint
  - Reuses existing `CurriculumGraph` component in selection mode for concluídas/cursando steps
  - Concluídas step shows single "Salvar como Concluídas" button; cursando step shows "Salvar como Cursando"
  - Cursando step has two-page flow: intro message then graph selection
  - Concluídas and cursando steps always show, displaying user's existing selections
  - Embedded PAAS turma picker for turmas step
  - Entidades step with expandable cards showing start/end month pickers for membership dates
  - "Tudo pronto!" final step with links to profile page and /calendario
  - Per-semester steps (cursando, turmas) reappear each new semester
  - Uncloseable modal with progress indicator — users must complete or skip each step
  - `onboardingMetadata` JSON field on Usuario model stores step completion state
  - `GET/PATCH /api/usuarios/me/onboarding` API endpoints with deep-merge semantics
  - `useOnboarding` hook handles step resolution, mutations, and PAAS availability checks
- **Dev Tools Panel**: Toggle MASTER_ADMIN/USER role via `POST /api/dev/promote-admin` (dev-only, auth-protected)

- **Auth Pages Redesign**: Modernized login, registration, forgot-password, and reset-password pages
  - New `AuthLayout` component with split-panel design (branding panel + form panel)
  - New `PasswordInput` component with eye/eye-off visibility toggle
  - Replaced all hardcoded colors with design tokens (`bg-card`, `border-border`, `text-muted-foreground`, `bg-aquario-primary`)
  - Entrance animation on form container using `tailwindcss-animate`
- **Seed data**: Added "Outro" Centro and Curso for students from other departments

### Changed
- **Registration flow**: Removed Centro dropdown; users now pick from a single flat Curso list (centroId derived automatically)
- **Dev Tools — Reset Onboarding**: Now also clears disciplinas concluídas, disciplinas do semestre, and período atual for a full reset

### Fixed
- **Grade Curricular — Transitive Unlocking**: Selecting a discipline now transitively unlocks all dependents (not just one level deep)
- **Grade Curricular — Locked Discipline Opacity**: Disciplines marked as concluída no longer appear locked/transparent

### Removed
- Deleted unused `login-form.tsx` shadcn template component

### Added
- **Disciplinas por Semestre**: New `DisciplinaSemestre` table to persist which disciplines (and specific PAAS turmas) a user is taking per semester
  - API route `GET/PUT /api/usuarios/me/semestres/[semestreId]/disciplinas` with "ativo" shorthand for active semester
  - Server-side resolution of discipline codes from PAAS to database IDs
  - Snapshot fields (turma, docente, horario, codigoPaas) preserve volatile PAAS data
- **Minhas Disciplinas**: New personal semester dashboard at `/calendario` for logged-in users
  - Side-by-side layout: discipline list (left) + calendar grid (right)
  - Add/remove disciplines with search, pick PAAS turmas per discipline
  - Calendar auto-updates as turmas are selected
  - Non-logged-in users still see the original PAAS explorer with localStorage persistence
- **Marcar Disciplinas API**: `POST /api/usuarios/me/disciplinas/marcar` — atomic endpoint for setting discipline status (concluída/cursando/none) with mutual exclusivity enforced via transaction
- **Patch Disciplina Semestre API**: `PATCH /api/usuarios/me/semestres/[semestreId]/disciplinas/[id]` — update turma details on a single enrollment record
- **Disciplina Search API**: `GET /api/disciplinas/search?q=term` — public search by code or name
- **Grade Curricular — Dialog Actions**: Clicking a discipline opens a detail dialog with buttons to mark as Concluída or Cursando directly
- **Grade Curricular — Bulk Selection**: "Selecionar cadeiras" mode with dropdown save (Concluídas or Cursando), replacing the old concluída-only selection
- **Grade Curricular — Nudge Banner**: When user has cursando disciplines without turma, shows a purple banner linking to `/calendario`
- **Mobile Navigation**: Added "GRADES" link to hamburger menu for direct Grade Curricular access

### Changed
- **Minhas Disciplinas — Semester Validation**: Uses DB active semester as source of truth; turma selection and calendar are disabled when SACI data doesn't match the current semester, with user-facing warnings
- **Calendário → Minhas Disciplinas**: Renamed across navigation (desktop dropdown, mobile hamburger, recursos page, home page)
- **Semester Fallback**: When between semesters, the system now falls back to the next upcoming semester instead of returning nothing
- **Grade Curricular**: Unified click interaction model — first click shows dependencies, second click opens dialog (removed hover-based highlighting)
- **Grade Curricular**: Completed and cursando states now read directly from server data instead of local optimistic copies
- **Calendário**: Calendar export (ICS and Google Calendar) now uses semester start/end dates from the matching `SemestreLetivo` (based on the period in the PAAS data) instead of hardcoded `SEMESTER_END_DATE` constant and relative-to-today start dates
- **Calendário**: Replaced `alert()` calls with `toast.error()` from Sonner for consistent UX

### Fixed
- **API Routes**: Malformed JSON request bodies now return 400 instead of 500

## [1.2.0] - 2026-02-17

### Fix
- Added images for calendario academico that were missing

## [1.2.0] - 2026-02-17

### Added
- **Calendário Acadêmico**: Full academic calendar system for UFPB semester events
  - Database: `SemestreLetivo` and `EventoCalendario` models with `CategoriaEvento` enum (12 categories)
  - Backend: Repository pattern with Prisma, REST API routes for CRUD on semesters and events (including batch create for CSV import)
  - Admin page (`/admin/calendario-academico`): Manage semesters and events, CSV upload with auto-category detection, editable category dropdowns
  - Public page (`/calendario-academico`): Timeline/list view grouped by month and monthly calendar grid view, semester selector, category filter chips, current-day highlighting
  - Added to nav bar resources dropdown, main page, and recursos page
- **404 Page**: Custom not-found page with themed illustrations — anglerfish for dark mode (centered, glowing text) and empty fishbowl for light mode (side-by-side layout). Responsive design with stacked mobile layout.

### Changed
- **Release script**: GitHub Releases now include changelog notes from `CHANGELOG.md` alongside auto-generated commit notes

## [1.1.1] - 2026-02-11

### Fixed
- **User Search API**: `/api/usuarios?search=` now uses `withAuth` instead of `withAdmin`, allowing entity admins to search for users

### Changed
- **Grades Curriculares**: on mobile, disable hover-based dependency highlighting (use tap instead) and require double-tap to open detail dialog; on desktop, click opens dialog directly

### Added
- **Disciplinas Concluídas**: users can now mark disciplines as completed on the curriculum grid
  - New `DisciplinaConcluida` database table linking users to completed disciplines
  - API endpoints `GET/PUT /api/usuarios/me/disciplinas` for fetching and syncing completed disciplines
  - Selection mode toggle on the grades curriculares page (available when viewing own course)
  - Green checkmark visual for completed disciplines, amber ring for unlocked (prereqs met) disciplines
  - Progress bar showing completed obligatory disciplines count, percentage, and hours
  - Save button to persist progress to the server
  - Course progress card on the user profile page with mini progress bar and link to the grade

---

## [1.1.0] - 2026-02-07

### Added
- Curriculo system: `Curriculo`, `Disciplina`, `CurriculoDisciplina`, `PreRequisitoDisciplina`, and `Equivalencia` database tables
- `NaturezaDisciplina` enum (Obrigatória, Optativa, Complementar Flexiva)
- Each Curso can have multiple curriculos with one active at a time
- Seed imports curriculo data from `content/aquario-curriculos/` CSVs (4 courses, 247 disciplinas, 295 prerequisites, 199 equivalences)
- Admin "Cursos" page with CRUD management for Campus, Centros, and Cursos
- Backend CRUD API routes for Campus (`/api/campus`), Centros (`/api/centros`), and Cursos (`/api/cursos`)
- `ICampusRepository` interface and Prisma implementation
- Extended `ICentrosRepository` and `ICursosRepository` with create/update/delete methods
- Reusable `ConfirmDeleteDialog` component using shadcn AlertDialog
- Dependency checks (`countDependencies`) on Campus, Centro, and Curso repositories
- `HAS_DEPENDENCIES` error code for blocked deletions (409 Conflict)
- "Grades Curriculares" ferramenta: interactive curriculum graph visualization
  - Course selector dropdown to pick any curso
  - Visual graph with discipline nodes grouped by period (semester columns)
  - SVG bezier arrows showing prerequisite chains between disciplines
  - Color-coded nodes: blue (obrigatória), amber (optativa), green (complementar)
  - Hover highlights full dependency chain (prerequisites + dependents)
  - Toggle to show/hide optativas
  - Detail dialog on click with navigation through prerequisites and equivalences
  - Auto-selects logged-in user's course, or first available
- `ICurriculosRepository` and `GET /api/curriculos/grade` endpoint for grade data
- Added Grades Curriculares to recursos page, navigation dropdown, and landing page
- Production import script (`db:import-prod`) with batched queries for remote databases

### Changed
- Delete confirmation in admin Cursos page now uses proper dialog instead of browser `confirm()`
- DELETE API routes for Campus/Centro/Curso now check for related data and return 409 with descriptive message instead of silently failing
- Replaced Sistemas de Informação and Matemática Computacional courses with Engenharia de Robôs in seed
- Landing page hero button changed to "Explore a Grade Curricular"
- "Novo" badge moved from Mapas to Grades Curriculares on landing page

### Fixed
- CSV seed parser now trims headers to handle Windows-style line endings (fixes missing ementa/syllabus data)

---

## [1.0.15] - 2025-02-06

### Changed
- DiceBear avatars now use gender-based background colors (purple for female names ending in -a, blue for others)
- Tuned DiceBear avatar params: scale 70, fixed shape rotation and offset

### Fixed
- Allowed `api.dicebear.com` hostname and SVG images in Next.js image config

---

## [1.0.14] - 2025-02-06

### Fixed
- Applied DiceBear default avatars to all remaining user avatar spots (entity members section, add member form, members table)

---

## [1.0.13] - 2025-02-06

### Fixed
- Fixed `require-await` lint error in `useSearchUsers` hook that was breaking the build

---

## [1.0.12] - 2025-02-06

### Added
- Release script. Using it in the release command now.

## [1.0.11] - 2025-02-06

### Added
- Default avatars using DiceBear Thumbs API — users without a profile picture now get a unique, deterministic avatar based on their ID
- Facade users get a distinct whitish avatar color (`f1f4dc`), normal users get a random color from `0a5b83`, `1c799f`, `69d2e7`

### Changed
- Merged `constants/entity-types.ts` into `types/vaga.types.ts` — all vaga-related definitions now live in one file

### Removed
- Deleted `src/lib/shared/constants/` directory (only contained entity types, now in `vaga.types.ts`)
- Deleted unused `tadea` (lost & found) component

---

## [1.0.9] - 2025-02-05

### Added
- Add/Update user profile images
- Support for tracking membership `startedAt` and `endedAt` in `MembroEntidade`.
- Support for "facade" users (placeholders for real people that haven't logged in yet).
- **Admin Functionality**:
  - Ability to manually create facade users from the Admin panel.
  - Dialog to search and add members to an entity directly from its page.
  - CLI script (`npm run merge-facade-user`) to merge facade accounts into real user profiles while preserving history.
- Added Cargos: each Entidade can manage its cargos and memberships
- AI assistant guidelines (`.claude/CLAUDE.md`, `.cursor/rules.md`)
- **CI/CD Pipeline** (GitHub Actions + Vercel + Neon):
  - `preview.yml`: Preview deployments for PRs with unique Vercel URLs and Neon database branches
  - `staging.yml`: Staging deployment on push to main (resets Neon staging branch from main)
  - `production.yml`: Production deployment on GitHub Release (creates PR to update version badge)
  - `tests.yml`: Unit and integration tests on PR and push to main
  - Automatic cleanup of Neon branches when PRs close
  - Branch limit management (max 8 preview branches, auto-deletes oldest)
  - Neon endpoint polling to wait for database readiness
  - Vercel configured to only auto-build on main (other deploys via CLI)
- **Release automation**: `npm run release:patch:push` (and minor/major) creates tag, pushes, and creates GitHub Release in one command
- **Environment indicator**: `NEXT_PUBLIC_IS_STAGING` env var + console logs show current environment (dev/staging/production)
- **README badges**: Version, changelog, tests, production/staging links, "commits ahead" indicator showing unreleased changes
- Auto-update version badge on release via PR

### Changed
- Improved UI for entidades page
- **Refactored `apiClient`**: Now auto-prepends `API_URL`, simplifying all frontend API calls
- **Standardized frontend API services**: All services now use `apiClient` instead of raw `fetch()`
- **Standardized backend error format**: All API routes now throw `ApiError` with machine-readable `ErrorCode`
- Updated README-DEV.md with CI/CD workflow documentation
- Upgraded Node.js requirement from 18+ to 22+

### Removed
- **Removed in-memory database implementation**: Deleted unused memory repositories and `DB_PROVIDER` config. PostgreSQL via Docker or cloud is now the only option.
- **Removed Playwright E2E tests**: Simplified testing setup to Jest (unit) + Vitest (integration) only.

### Security
- **Preview deployments now use seed data only**: Prevents exposing production data in public preview URLs. Preview branches reset and seed instead of copying staging data.

### Fixed
- Fixed `postinstall` script location in package.json (was outside `scripts` block)
- Fixed failing unit tests due to error message changes

### Testing
- **Increased test coverage from 55% to 79%**
  - Added comprehensive tests for `api-error.ts` (37% → 97%)
  - Added tests for `api-client.ts` token refresh logic (28% → 88%)
  - Added tests for `entidades.ts` service methods (4% → 84%)
  - Expanded tests for `usuarios.ts` (30% → 78%)
- Fixed Vitest localStorage mock for integration tests
- Total: 71 new unit tests added

---

## [1.0.2] - 2024-12-24

### Changed
- **Upgraded Next.js from 14.2.18 to 15.5.9** (latest stable)
- **Upgraded ESLint from 8 to 9** (required by Next.js 15)
- Updated all route handlers to use async params (Next.js 15 breaking change)
- Updated all page components to use `React.use()` for params unwrapping

### Removed
- Removed unused `reactjs-tiptap-editor` library and related pages (-220 packages)
- Removed unused `react-quill` library
- Removed broken editor component

### Security
- **Fixed all npm audit vulnerabilities** (5 → 0)
  - Fixed glob vulnerability in eslint-config-next
  - Removed react-quill XSS vulnerability

## [1.0.1] - 2024-12-24

### Changed
- Default to in-memory database provider when `DATABASE_URL` is not set, allowing developers to run the app without any database setup

## [1.0.0] - 2024-12-24

### Added

#### Core Platform
- **Guides (Guias)**: Course-specific guides for CI-UFPB students
  - Ciência da Computação
  - Engenharia da Computação
  - Ciência de Dados e Inteligência Artificial
- **Entities (Entidades)**: Directory of labs, research groups, and student organizations
- **Maps (Mapas)**: Interactive campus maps with room locations
- **Opportunities (Vagas)**: Job listings, internships, and research positions
- **Calendar (Calendário)**: Academic calendar integration

#### Technical Foundation
- Next.js 14 App Router architecture
- PostgreSQL database with Prisma ORM
- In-memory database option for local development
- Authentication system with JWT
- Email verification flow
- Git submodules for content management

#### Developer Experience
- Comprehensive test suite (Jest, Vitest, Playwright)
- ESLint + Prettier configuration
- TypeScript strict mode
- Docker Compose for local database
- CI/CD ready structure

---

## How to Update This Changelog

When making changes, add entries under `[Unreleased]` in the appropriate category:

- **Added** — New features
- **Changed** — Changes in existing functionality
- **Deprecated** — Soon-to-be removed features
- **Removed** — Removed features
- **Fixed** — Bug fixes
- **Security** — Vulnerability fixes

Before releasing, move all `[Unreleased]` entries to a new version section with the release date.

### Release Commands

```bash
# Local only (creates tag but doesn't push or deploy)
npm run release:patch
npm run release:minor
npm run release:major

# Full release (creates tag, pushes, creates GitHub Release → deploys to production)
npm run release:patch:push   # Bug fixes (1.0.0 → 1.0.1)
npm run release:minor:push   # New features (1.0.0 → 1.1.0)
npm run release:major:push   # Breaking changes (1.0.0 → 2.0.0)
```

> **Note:** The `:push` commands require GitHub CLI (`gh auth login`)

[Unreleased]: https://github.com/aquario-ufpb/aquario/compare/v1.7.0...HEAD
[1.7.0]: https://github.com/aquario-ufpb/aquario/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/aquario-ufpb/aquario/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/aquario-ufpb/aquario/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/aquario-ufpb/aquario/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/aquario-ufpb/aquario/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/aquario-ufpb/aquario/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/aquario-ufpb/aquario/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/aquario-ufpb/aquario/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/aquario-ufpb/aquario/compare/v1.0.10...v1.1.0
[1.0.10]: https://github.com/aquario-ufpb/aquario/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/aquario-ufpb/aquario/compare/v1.0.2...v1.0.9
[1.0.2]: https://github.com/aquario-ufpb/aquario/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/aquario-ufpb/aquario/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/aquario-ufpb/aquario/releases/tag/v1.0.0

