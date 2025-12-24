# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- _New features will be listed here_

### Changed
- _Changes in existing functionality will be listed here_

### Fixed
- _Bug fixes will be listed here_

---

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

[Unreleased]: https://github.com/aquario-ufpb/aquario/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/aquario-ufpb/aquario/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/aquario-ufpb/aquario/releases/tag/v1.0.0

