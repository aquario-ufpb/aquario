# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Lint**: Replaced `as any` casts in `register.test.ts` with `as unknown as RegisterDependencies[…]` indexed-access types.
- **Lint**: Added missing `isInsideSemester` dependency to `useMemo` in `use-onboarding.ts`.
- **Lint**: Stabilized `today` Date construction in `periodo-picker.tsx` with its own `useMemo(() => new Date(), [])`.
- **Lint**: Replaced non-null assertion in `vagas.test.ts` with an explicit `if (result === null)` guard.
- **Lint**: Suppressed `@next/next/no-img-element` in `novo-vaga-page.integration.test.tsx` test fixture via inline ESLint comment.

## [1.8.0] - 2026-05-04

### Added
- **SEO**: `src/app/sitemap.ts` — generates `sitemap.xml` listing every public page plus all `PUBLICADO` projetos, entidades, and guia sections. Revalidates hourly so new content reaches search engines without a redeploy.
- **SEO**: `src/app/robots.ts` — emits `robots.txt` allowing public routes and disallowing API, admin, auth, edit/create flows, and internal pages (`/api-docs`, `/metrics`).

### Changed
- **Projeto Page (SEO)**: `/projetos/[id]` is now server-rendered for `PUBLICADO` projects. Adds per-project `<title>`, `description`, OpenGraph/Twitter card with cover image, canonical URL, keywords from tags, and `CreativeWork` JSON-LD structured data. Drafts/archived projects render `noindex` and continue to fetch via the authenticated API path. The interactive parts (edit/archive, markdown rendering, similar section) live in a new client child component; React Query is hydrated via `initialData` so the page paints immediately.
- **Entidade Page (SEO)**: `/entidade/[slug]` is now server-rendered. Adds per-entidade `<title>` (with tipo label), description from `subtitle`/`descricao`, OG/Twitter card with `urlFoto`, canonical URL, and `Organization` JSON-LD (name, image, website, Instagram, LinkedIn, foundingDate, location).
- **Usuário Profile (SEO)**: `/usuarios/[slug]` is now server-rendered. Adds per-user `<title>`, description (curso + centro), OG/Twitter card with avatar, canonical URL, and `Person` JSON-LD with `affiliation` + `alumniOf`. Facade users render `noindex`.
- **Guias Page (SEO)**: `/guias/[[...parts]]` resolves the path on the server to emit per-page `<title>` and canonical URL — root, guia, secao, and subsecao each get a distinct title built from the breadcrumb (`Subsecao · Secao · Guia · Aquário`). Unknown sections/subsections emit `noindex`.
- **Landing Page (SEO)**: `/` now exports per-page `metadata` (title, description, OG/Twitter); previously inherited only the root layout's generic metadata. The interactive landing body moved to `src/app/landing-client.tsx`.
- **About / Recursos (SEO)**: `/sobre` and `/recursos` export per-page `metadata` with title, description, canonical, and OG.
- **Listing Pages (SEO)**: `/projetos`, `/entidades`, `/calendario`, `/calendario-academico`, `/mapas`, `/grades-curriculares` each get a sibling `layout.tsx` exporting per-route metadata. The client `page.tsx` files are unchanged — the layout supplies the `<title>` / OG that crawlers and social cards read from the static HTML shell.
- **Search**: Global search bar now indexes Projetos. Matches PUBLICADO projetos by `titulo`, `subtitulo`, and `tags`, opening the projeto detail page (`/projetos/[slug]`). The `/projetos` landing page is also returned as a static-page result.

## [1.7.1] - 2026-05-03

### Added
- **Navigation**: Add `Projetos` link to the desktop navbar and mobile hamburger menu.
- **Landing Page**: Add a "Projetos destaque" section inside the underwater area, above Recursos — an infinite-loop carousel showing 3 cards at a time, drawn from a random sample of the top projects by author count.