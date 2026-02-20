# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Calendário → Minhas Disciplinas**: Renamed across navigation (desktop dropdown, mobile hamburger, ferramentas page, home page)
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
  - Added to nav bar tools dropdown, main page, and ferramentas page
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
- Added Grades Curriculares to ferramentas page, navigation dropdown, and landing page
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

[Unreleased]: https://github.com/aquario-ufpb/aquario/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/aquario-ufpb/aquario/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/aquario-ufpb/aquario/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/aquario-ufpb/aquario/compare/v1.0.10...v1.1.0
[1.0.10]: https://github.com/aquario-ufpb/aquario/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/aquario-ufpb/aquario/compare/v1.0.2...v1.0.9
[1.0.2]: https://github.com/aquario-ufpb/aquario/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/aquario-ufpb/aquario/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/aquario-ufpb/aquario/releases/tag/v1.0.0

