# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Add/Update user profile image
- Support for tracking membership `startedAt` and `endedAt` in `MembroEntidade`.
- Support for "facade" users (placeholders for real people that haven't logged in yet).
- **Admin Functionality**:
  - Ability to manually create facade users from the Admin panel.
  - Dialog to search and add members to an entity directly from its page.
  - CLI script (`npm run merge-facade-user`) to merge facade accounts into real user profiles while preserving history.
- Added Cargos: each Entidade can manage its cargos and memberships
- AI assistant guidelines (`.claude/CLAUDE.md`, `.cursor/rules.md`)

### Changed
- Improved UI for entidades page
- **Refactored `apiClient`**: Now auto-prepends `API_URL`, simplifying all frontend API calls
- **Standardized frontend API services**: All services now use `apiClient` instead of raw `fetch()`
- **Standardized backend error format**: All API routes now throw `ApiError` with machine-readable `ErrorCode`

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
# Patch release (1.0.0 → 1.0.1) - Bug fixes
npm run release:patch

# Minor release (1.0.0 → 1.1.0) - New features
npm run release:minor

# Major release (1.0.0 → 2.0.0) - Breaking changes
npm run release:major
```

[Unreleased]: https://github.com/aquario-ufpb/aquario/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/aquario-ufpb/aquario/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/aquario-ufpb/aquario/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/aquario-ufpb/aquario/releases/tag/v1.0.0

