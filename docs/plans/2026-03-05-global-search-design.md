# Global Search - Design Document

**Date:** 2026-03-05
**Branch:** feat/search
**Status:** Approved

## 1. Overview

Command palette global (cmdk) activated by `Ctrl+K` / `/` (desktop) or search icon (mobile/navbar). A single endpoint `GET /api/search?q=term&limit=5` searches 7 categories in parallel on the backend using PostgreSQL Full-Text Search with `unaccent` + `to_tsvector('portuguese')` and GIN indexes.

### Goals
- Search across all Aquario content from anywhere in the app
- Minimized latency via single endpoint + Promise.all()
- Accent-insensitive search for Brazilian Portuguese
- Ranked results using ts_rank

### Non-Goals (v1)
- pg_trgm / advanced fuzzy matching
- Scoped search (filter by category before searching)
- Popular search suggestions / analytics
- "View all results" page (strong v2 candidate)
- Skeleton loading per category (simple spinner for v1)

## 2. Backend

### 2.1 Endpoint

```
GET /api/search?q={term}&limit={n}
```

**Rules:**
- Minimum 3 characters to trigger search
- `limit` default = 5 per category
- `Promise.all()` for parallel category search
- No auth required (public data), except Usuarios (requires auth)
- Wrapped in `createApiHandler`

**Response:**

```json
{
  "query": "laboratorio",
  "results": {
    "paginas": [{ "id": "mapas", "titulo": "Mapas do Campus", "descricao": "...", "url": "/mapas", "kind": "pagina" }],
    "guias": [{ "id": "1", "titulo": "Lab de Micro", "slug": "lab-micro", "descricao": "...", "kind": "guia" }],
    "entidades": [{ "id": "1", "nome": "LABCOM", "slug": "labcom", "tipo": "LABORATORIO", "kind": "entidade" }],
    "vagas": [{ "id": "1", "titulo": "Tecnico de Lab", "tipo": "ESTAGIO", "kind": "vaga" }],
    "disciplinas": [{ "id": "1", "codigo": "CHEM101", "nome": "Lab Quimica", "kind": "disciplina" }],
    "cursos": [{ "id": "1", "nome": "Eng. Quimica", "kind": "curso" }],
    "usuarios": [{ "id": "1", "nome": "Joao Lab", "profileUrl": "...", "kind": "usuario" }]
  }
}
```

Every result item includes a `kind` discriminant field for typed routing on the frontend.

### 2.2 Search Repository

Each searchable entity gets a `search(query, limit)` method using `prisma.$queryRaw` with FTS:

```sql
SELECT id, nome, slug, tipo,
  ts_rank(
    to_tsvector('portuguese', unaccent(nome || ' ' || coalesce(descricao, ''))),
    plainto_tsquery('portuguese', unaccent($1))
  ) as rank
FROM entidades
WHERE to_tsvector('portuguese', unaccent(nome || ' ' || coalesce(descricao, '')))
  @@ plainto_tsquery('portuguese', unaccent($1))
ORDER BY rank DESC
LIMIT $2
```

### 2.3 Static Pages

Hardcoded array in `src/lib/server/search/static-pages.ts`, filtered with `normalize()` (lowercase + remove accents) + `includes()`.

Pages: Sobre, Mapas, Ferramentas, Calendario Academico, Grades Curriculares, Login, Registro.

### 2.4 Database Migration

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE INDEX idx_guias_fts ON guias
  USING GIN (to_tsvector('portuguese', unaccent(titulo || ' ' || coalesce(descricao, ''))));

CREATE INDEX idx_entidades_fts ON entidades
  USING GIN (to_tsvector('portuguese', unaccent(nome || ' ' || coalesce(descricao, ''))));

CREATE INDEX idx_vagas_fts ON vagas
  USING GIN (to_tsvector('portuguese', unaccent(titulo || ' ' || coalesce(descricao, ''))));

CREATE INDEX idx_disciplinas_fts ON disciplinas
  USING GIN (to_tsvector('portuguese', unaccent(nome || ' ' || coalesce(codigo, ''))));

CREATE INDEX idx_cursos_fts ON cursos
  USING GIN (to_tsvector('portuguese', unaccent(nome)));

CREATE INDEX idx_usuarios_fts ON usuarios
  USING GIN (to_tsvector('portuguese', unaccent(nome)));
```

## 3. Frontend

### 3.1 Activation
- **Desktop:** `Ctrl+K` or `/` opens CommandDialog
- **Mobile:** Search icon in hamburger menu
- **Navbar:** Clickable search icon (both versions)

### 3.2 Behavior
- Debounce 300ms after typing stops
- Minimum 3 characters to call API
- React Query for cache and request deduplication
- Keyboard navigation: Up/Down navigates, Enter selects, Esc closes

### 3.3 Result Groups (ordered)

1. Paginas (navigation shortcuts)
2. Guias (main portal content)
3. Entidades (labs, groups, CAs)
4. Vagas (jobs/internships)
5. Disciplinas (code/name)
6. Cursos (degrees)
7. Usuarios (profiles)

**UX Details:**
- Highlight search term in bold within results
- Different icons/colors per category
- Empty categories are hidden
- Empty state: "Nenhum resultado para '{term}'"
- Initial state (no query): recent search history from localStorage (max 8)

### 3.4 Navigation on Select

| Kind | Route |
|------|-------|
| pagina | `router.push(url)` |
| guia | `/guias/{slug}` |
| entidade | `/entidade/{slug}` |
| vaga | `/vagas/{id}` |
| disciplina | TBD (info display or navigate) |
| curso | TBD (info display or navigate) |
| usuario | `/perfil/{id}` or similar |

## 4. Component Structure

```
src/
  components/
    shared/
      search/
        search-command.tsx      # CommandDialog principal
        search-group.tsx        # Result group per category
        search-item.tsx         # Individual item with highlight + kind-based icon
        search-trigger.tsx      # Button/icon that opens dialog
  lib/
    client/
      api/
        search.ts              # searchService.search(query, limit)
      hooks/
        use-search.ts          # useSearch() hook with React Query + debounce
    server/
      db/
        interfaces/
          search-repository.ts # ISearchRepository interface
        prisma/
          search-repository.ts # Raw SQL FTS implementation
      search/
        static-pages.ts        # Static pages array + filter function
    shared/
      types/
        search.ts              # SearchResult, SearchResponse types + kind union
```

## 5. Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Search engine | PostgreSQL FTS | Already using PG, performant up to ~1M records, zero infra |
| Accent handling | `unaccent` extension | Solves 95% of Brazilian Portuguese search issues |
| Fuzzy matching | Not in v1 | `pg_trgm` deferred — unaccent covers real user problems |
| UI library | cmdk (already installed) | CommandDialog component exists, keyboard nav built-in |
| State management | React Query | Already in project, handles cache + dedup |
| Static pages | Backend hardcoded array | Centralizes all search logic, consistent filtering |

## 6. Future (v2+)

- "Ver todos os resultados" page (strong candidate)
- pg_trgm for typo tolerance if needed after usage data
- Scoped search (filter by category)
- Popular searches / analytics
- Skeleton loading per category
- Search result click tracking
