# Global Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a command palette (Ctrl+K) with unified search across 7 entity categories using PostgreSQL Full-Text Search.

**Architecture:** Single `GET /api/search?q=term&limit=5` endpoint searches all categories in parallel via `Promise.all()`. Backend uses `prisma.$queryRaw` with `to_tsvector('portuguese', unaccent(...))` + GIN indexes. Frontend uses the existing cmdk `CommandDialog` component with React Query + debounce.

**Tech Stack:** Next.js 15, Prisma (raw SQL), PostgreSQL FTS + unaccent, cmdk, TanStack Query, Tailwind CSS.

---

## Task 1: Shared Types

**Files:**
- Create: `src/lib/shared/types/search.types.ts`
- Modify: `src/lib/shared/types/index.ts`

**Step 1: Create search types**

```typescript
// src/lib/shared/types/search.types.ts

export type SearchResultKind =
  | "pagina"
  | "guia"
  | "entidade"
  | "vaga"
  | "disciplina"
  | "curso"
  | "usuario";

export type SearchResultPagina = {
  kind: "pagina";
  id: string;
  titulo: string;
  descricao: string;
  url: string;
};

export type SearchResultGuia = {
  kind: "guia";
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
};

export type SearchResultEntidade = {
  kind: "entidade";
  id: string;
  nome: string;
  slug: string | null;
  tipo: string;
};

export type SearchResultVaga = {
  kind: "vaga";
  id: string;
  titulo: string;
  tipoVaga: string;
};

export type SearchResultDisciplina = {
  kind: "disciplina";
  id: string;
  codigo: string;
  nome: string;
};

export type SearchResultCurso = {
  kind: "curso";
  id: string;
  nome: string;
};

export type SearchResultUsuario = {
  kind: "usuario";
  id: string;
  nome: string;
  slug: string | null;
  urlFotoPerfil: string | null;
};

export type SearchResultItem =
  | SearchResultPagina
  | SearchResultGuia
  | SearchResultEntidade
  | SearchResultVaga
  | SearchResultDisciplina
  | SearchResultCurso
  | SearchResultUsuario;

export type SearchResponse = {
  query: string;
  results: {
    paginas: SearchResultPagina[];
    guias: SearchResultGuia[];
    entidades: SearchResultEntidade[];
    vagas: SearchResultVaga[];
    disciplinas: SearchResultDisciplina[];
    cursos: SearchResultCurso[];
    usuarios: SearchResultUsuario[];
  };
};
```

**Step 2: Export from index**

Add to `src/lib/shared/types/index.ts`:

```typescript
export * from "./search.types";
```

**Step 3: Commit**

```bash
git add src/lib/shared/types/search.types.ts src/lib/shared/types/index.ts
git commit -m "feat(search): add shared search types"
```

---

## Task 2: Database Migration — unaccent Extension + GIN Indexes

**Files:**
- Create: Prisma migration via raw SQL

**Important context:** The Prisma schema uses these exact table/column names (from `schema.prisma`):
- `"Guia"` table: columns `titulo`, `descricao`, `status` (filter `ATIVO`)
- `"Entidade"` table: columns `nome`, `descricao`, `slug`, `tipo`
- `"Vaga"` table: columns `titulo`, `descricao`, `"tipoVaga"`, `"deletadoEm"`
- `"Disciplina"` table: columns `codigo`, `nome`
- `"Curso"` table: column `nome`
- `"Usuario"` table: columns `nome`, `slug`, `"urlFotoPerfil"`, `"eFacade"`

Prisma maps model names to table names with the same casing. Column names also keep exact casing.

**Step 1: Create migration SQL file**

```bash
npx prisma migrate dev --create-only --name add_search_fts_indexes
```

This creates an empty migration file. Replace its contents with:

```sql
-- Enable unaccent extension for accent-insensitive search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- GIN indexes for Full-Text Search on each searchable table
-- Using immutable wrapper function for unaccent (required for index expressions)
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent($1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

CREATE INDEX idx_guias_fts ON "Guia"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, ''))));

CREATE INDEX idx_entidades_fts ON "Entidade"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(descricao, ''))));

CREATE INDEX idx_vagas_fts ON "Vaga"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, ''))));

CREATE INDEX idx_disciplinas_fts ON "Disciplina"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(codigo, ''))));

CREATE INDEX idx_cursos_fts ON "Curso"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(nome)));

CREATE INDEX idx_usuarios_fts ON "Usuario"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(nome)));
```

**Note:** `unaccent()` is not immutable by default, so we create an `immutable_unaccent()` wrapper. This is required for GIN index expressions. See: https://www.postgresql.org/docs/current/unaccent.html

**Step 2: Run the migration**

```bash
npx prisma migrate dev
```

Expected: Migration applied successfully, 6 indexes created.

**Step 3: Commit**

```bash
git add prisma/migrations/
git commit -m "feat(search): add unaccent extension and FTS GIN indexes"
```

---

## Task 3: Static Pages Search Module

**Files:**
- Create: `src/lib/server/search/static-pages.ts`

**Step 1: Create static pages module**

```typescript
// src/lib/server/search/static-pages.ts

import type { SearchResultPagina } from "@/lib/shared/types/search.types";

type StaticPage = {
  id: string;
  titulo: string;
  descricao: string;
  url: string;
};

const STATIC_PAGES: StaticPage[] = [
  {
    id: "sobre",
    titulo: "Sobre o Aquario",
    descricao: "Entenda o proposito e visao do Aquario",
    url: "/sobre",
  },
  {
    id: "mapas",
    titulo: "Mapas do Campus",
    descricao: "Visualize mapas, predios e laboratorios da UFPB",
    url: "/mapas",
  },
  {
    id: "ferramentas",
    titulo: "Ferramentas",
    descricao: "Disciplinas, guias, mapas, grades e calendario academico",
    url: "/ferramentas",
  },
  {
    id: "calendario-academico",
    titulo: "Calendario Academico",
    descricao: "Datas importantes do semestre letivo da UFPB",
    url: "/calendario-academico",
  },
  {
    id: "grades-curriculares",
    titulo: "Grades Curriculares",
    descricao: "Consulte grades curriculares dos cursos",
    url: "/grades-curriculares",
  },
  {
    id: "calendario",
    titulo: "Minhas Disciplinas",
    descricao: "Gerencie suas disciplinas e horarios do semestre",
    url: "/calendario",
  },
  {
    id: "entidades",
    titulo: "Entidades",
    descricao: "Laboratorios, grupos de pesquisa, ligas academicas e centros academicos",
    url: "/entidades",
  },
  {
    id: "guias",
    titulo: "Guias",
    descricao: "Documentacao e tutoriais para estudantes",
    url: "/guias",
  },
  {
    id: "vagas",
    titulo: "Vagas",
    descricao: "Estagios, pesquisa e oportunidades para estudantes",
    url: "/vagas",
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function searchStaticPages(query: string, limit: number): SearchResultPagina[] {
  const normalizedQuery = normalize(query);

  return STATIC_PAGES.filter((page) => {
    const haystack = normalize(`${page.titulo} ${page.descricao}`);
    return haystack.includes(normalizedQuery);
  })
    .slice(0, limit)
    .map((page) => ({
      kind: "pagina" as const,
      id: page.id,
      titulo: page.titulo,
      descricao: page.descricao,
      url: page.url,
    }));
}
```

**Step 2: Commit**

```bash
git add src/lib/server/search/static-pages.ts
git commit -m "feat(search): add static pages search module"
```

---

## Task 4: Search Repository — Interface + Prisma Implementation

**Files:**
- Create: `src/lib/server/db/interfaces/search-repository.interface.ts`
- Create: `src/lib/server/db/implementations/prisma/prisma-search-repository.ts`

**Step 1: Create repository interface**

```typescript
// src/lib/server/db/interfaces/search-repository.interface.ts

import type {
  SearchResultGuia,
  SearchResultEntidade,
  SearchResultVaga,
  SearchResultDisciplina,
  SearchResultCurso,
  SearchResultUsuario,
} from "@/lib/shared/types/search.types";

export type ISearchRepository = {
  searchGuias(query: string, limit: number): Promise<SearchResultGuia[]>;
  searchEntidades(query: string, limit: number): Promise<SearchResultEntidade[]>;
  searchVagas(query: string, limit: number): Promise<SearchResultVaga[]>;
  searchDisciplinas(query: string, limit: number): Promise<SearchResultDisciplina[]>;
  searchCursos(query: string, limit: number): Promise<SearchResultCurso[]>;
  searchUsuarios(query: string, limit: number): Promise<SearchResultUsuario[]>;
};
```

**Step 2: Create Prisma implementation**

```typescript
// src/lib/server/db/implementations/prisma/prisma-search-repository.ts

import { PrismaClient, Prisma } from "@prisma/client";
import type { ISearchRepository } from "@/lib/server/db/interfaces/search-repository.interface";
import type {
  SearchResultGuia,
  SearchResultEntidade,
  SearchResultVaga,
  SearchResultDisciplina,
  SearchResultCurso,
  SearchResultUsuario,
} from "@/lib/shared/types/search.types";

const prisma = new PrismaClient();

export class PrismaSearchRepository implements ISearchRepository {
  async searchGuias(query: string, limit: number): Promise<SearchResultGuia[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; titulo: string; slug: string; descricao: string | null }>
    >(Prisma.sql`
      SELECT id, titulo, slug, descricao
      FROM "Guia"
      WHERE status = 'ATIVO'
        AND to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, '')))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, ''))),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map((r) => ({ kind: "guia" as const, ...r }));
  }

  async searchEntidades(query: string, limit: number): Promise<SearchResultEntidade[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; nome: string; slug: string | null; tipo: string }>
    >(Prisma.sql`
      SELECT id, nome, slug, tipo::text
      FROM "Entidade"
      WHERE to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(descricao, '')))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(descricao, ''))),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map((r) => ({ kind: "entidade" as const, ...r }));
  }

  async searchVagas(query: string, limit: number): Promise<SearchResultVaga[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; titulo: string; tipoVaga: string }>
    >(Prisma.sql`
      SELECT id, titulo, "tipoVaga"::text AS "tipoVaga"
      FROM "Vaga"
      WHERE "deletadoEm" IS NULL
        AND to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, '')))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, ''))),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map((r) => ({ kind: "vaga" as const, ...r }));
  }

  async searchDisciplinas(query: string, limit: number): Promise<SearchResultDisciplina[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; codigo: string; nome: string }>
    >(Prisma.sql`
      SELECT id, codigo, nome
      FROM "Disciplina"
      WHERE to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(codigo, '')))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(codigo, ''))),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map((r) => ({ kind: "disciplina" as const, ...r }));
  }

  async searchCursos(query: string, limit: number): Promise<SearchResultCurso[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; nome: string }>
    >(Prisma.sql`
      SELECT id, nome
      FROM "Curso"
      WHERE to_tsvector('portuguese', immutable_unaccent(nome))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(nome)),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map((r) => ({ kind: "curso" as const, ...r }));
  }

  async searchUsuarios(query: string, limit: number): Promise<SearchResultUsuario[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; nome: string; slug: string | null; urlFotoPerfil: string | null }>
    >(Prisma.sql`
      SELECT id, nome, slug, "urlFotoPerfil"
      FROM "Usuario"
      WHERE "eFacade" = false
        AND to_tsvector('portuguese', immutable_unaccent(nome))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(nome)),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map((r) => ({ kind: "usuario" as const, ...r }));
  }
}
```

**Important notes:**
- Prisma uses PascalCase table names (`"Guia"`, `"Entidade"`, etc.) — must quote them in raw SQL
- Enum columns need `::text` cast to return as strings
- `"Vaga"` filters `"deletadoEm" IS NULL` to exclude soft-deleted listings
- `"Guia"` filters `status = 'ATIVO'` to exclude drafts
- `"Usuario"` filters `"eFacade" = false` to exclude facade/placeholder users
- Uses `immutable_unaccent()` wrapper function (created in migration) for index compatibility

**Step 3: Commit**

```bash
git add src/lib/server/db/interfaces/search-repository.interface.ts src/lib/server/db/implementations/prisma/prisma-search-repository.ts
git commit -m "feat(search): add search repository interface and Prisma implementation"
```

---

## Task 5: Register Search Repository in DI Container

**Files:**
- Modify: `src/lib/server/container/types.ts` (add `searchRepository` field)
- Modify: `src/lib/server/container/index.ts` (instantiate `PrismaSearchRepository`)

**Step 1: Add to Container type**

In `src/lib/server/container/types.ts`, add the import and field:

```typescript
// Add import at top:
import type { ISearchRepository } from "@/lib/server/db/interfaces/search-repository.interface";

// Add field to Container type:
searchRepository: ISearchRepository;
```

**Step 2: Add to container factory**

In `src/lib/server/container/index.ts`, inside `createPrismaContainer()`:

```typescript
// Add with other dynamic imports:
const {
  PrismaSearchRepository,
} = require("@/lib/server/db/implementations/prisma/prisma-search-repository");

// Add to return object:
searchRepository: new PrismaSearchRepository(),
```

**Step 3: Commit**

```bash
git add src/lib/server/container/types.ts src/lib/server/container/index.ts
git commit -m "feat(search): register search repository in DI container"
```

---

## Task 6: Search API Route

**Files:**
- Create: `src/app/api/search/route.ts`

**Step 1: Create the search endpoint**

```typescript
// src/app/api/search/route.ts

import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { searchStaticPages } from "@/lib/server/search/static-pages";
import { ApiError } from "@/lib/server/errors";
import type { SearchResponse } from "@/lib/shared/types/search.types";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=term&limit=5
 * Unified search across all entity categories. Public endpoint.
 * Usuarios search is included but only returns non-facade public profiles.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 5, 20);

    if (!query || query.length < 3) {
      const empty: SearchResponse = {
        query: query || "",
        results: {
          paginas: [],
          guias: [],
          entidades: [],
          vagas: [],
          disciplinas: [],
          cursos: [],
          usuarios: [],
        },
      };
      return NextResponse.json(empty);
    }

    const container = getContainer();
    const repo = container.searchRepository;

    const [paginas, guias, entidades, vagas, disciplinas, cursos, usuarios] =
      await Promise.all([
        searchStaticPages(query, limit),
        repo.searchGuias(query, limit),
        repo.searchEntidades(query, limit),
        repo.searchVagas(query, limit),
        repo.searchDisciplinas(query, limit),
        repo.searchCursos(query, limit),
        repo.searchUsuarios(query, limit),
      ]);

    const response: SearchResponse = {
      query,
      results: {
        paginas,
        guias,
        entidades,
        vagas,
        disciplinas,
        cursos,
        usuarios,
      },
    };

    return NextResponse.json(response);
  } catch {
    return ApiError.internal("Erro ao realizar busca");
  }
}
```

**Step 2: Add endpoint constant**

In `src/lib/shared/config/constants.ts`, add to `ENDPOINTS`:

```typescript
// Search
SEARCH: "/search",
```

**Step 3: Commit**

```bash
git add src/app/api/search/route.ts src/lib/shared/config/constants.ts
git commit -m "feat(search): add unified search API endpoint"
```

---

## Task 7: Client Search Service + React Query Hook

**Files:**
- Create: `src/lib/client/api/search.ts`
- Create: `src/lib/client/hooks/use-search.ts`
- Modify: `src/lib/client/query-keys.ts`

**Step 1: Add query key**

In `src/lib/client/query-keys.ts`, add:

```typescript
search: {
  query: (q: string) => ["search", q] as const,
},
```

**Step 2: Create client search service**

```typescript
// src/lib/client/api/search.ts

import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";
import type { SearchResponse } from "@/lib/shared/types/search.types";

export const searchService = {
  search: async (query: string, limit = 5): Promise<SearchResponse> => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const response = await apiClient(`${ENDPOINTS.SEARCH}?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },
};
```

**Step 3: Create useSearch hook with debounce**

```typescript
// src/lib/client/hooks/use-search.ts

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { searchService } from "@/lib/client/api/search";
import { queryKeys } from "@/lib/client/query-keys";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useSearch(query: string, limit = 5) {
  const debouncedQuery = useDebounce(query.trim(), 300);
  const enabled = debouncedQuery.length >= 3;

  return useQuery({
    queryKey: queryKeys.search.query(debouncedQuery),
    queryFn: () => searchService.search(debouncedQuery, limit),
    enabled,
    staleTime: 60 * 1000, // 1 minute cache
  });
}
```

**Step 4: Commit**

```bash
git add src/lib/client/api/search.ts src/lib/client/hooks/use-search.ts src/lib/client/query-keys.ts
git commit -m "feat(search): add client search service and useSearch hook"
```

---

## Task 8: Search Command Palette — UI Components

**Files:**
- Create: `src/components/shared/search/search-command.tsx`
- Create: `src/components/shared/search/search-trigger.tsx`

**Step 1: Create search trigger button**

```typescript
// src/components/shared/search/search-trigger.tsx

"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchTriggerProps = {
  onClick: () => void;
};

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0 rounded-full"
      aria-label="Pesquisar (Ctrl+K)"
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}
```

**Step 2: Create main search command palette**

```typescript
// src/components/shared/search/search-command.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  BookOpen,
  Building2,
  Briefcase,
  GraduationCap,
  BookMarked,
  User,
  Clock,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useSearch } from "@/lib/client/hooks/use-search";
import type {
  SearchResultItem,
  SearchResultKind,
} from "@/lib/shared/types/search.types";

const HISTORY_KEY = "aquario:searchHistory";
const MAX_HISTORY = 8;

const CATEGORY_CONFIG: Record<
  SearchResultKind,
  { label: string; icon: React.ElementType }
> = {
  pagina: { label: "Paginas", icon: FileText },
  guia: { label: "Guias", icon: BookOpen },
  entidade: { label: "Entidades", icon: Building2 },
  vaga: { label: "Vagas", icon: Briefcase },
  disciplina: { label: "Disciplinas", icon: BookMarked },
  curso: { label: "Cursos", icon: GraduationCap },
  usuario: { label: "Usuarios", icon: User },
};

function getItemLabel(item: SearchResultItem): string {
  switch (item.kind) {
    case "pagina":
      return item.titulo;
    case "guia":
      return item.titulo;
    case "entidade":
      return item.nome;
    case "vaga":
      return item.titulo;
    case "disciplina":
      return `${item.codigo} - ${item.nome}`;
    case "curso":
      return item.nome;
    case "usuario":
      return item.nome;
  }
}

function getItemRoute(item: SearchResultItem): string {
  switch (item.kind) {
    case "pagina":
      return item.url;
    case "guia":
      return `/guias/${item.slug}`;
    case "entidade":
      return `/entidade/${item.slug}`;
    case "vaga":
      return `/vagas/${item.id}`;
    case "disciplina":
      return `/grades-curriculares`;
    case "curso":
      return `/grades-curriculares`;
    case "usuario":
      return item.slug ? `/perfil/${item.slug}` : `/perfil`;
  }
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 3) return text;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <span className="font-bold text-foreground">{match}</span>
      {after}
    </>
  );
}

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(query: string): void {
  try {
    const existing = loadHistory();
    const next = [query, ...existing.filter((item) => item !== query)].slice(
      0,
      MAX_HISTORY
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {}
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();
  const { data, isLoading } = useSearch(query);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Keyboard shortcut: Ctrl+K or /
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const isSlash =
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName
        );

      if (isCmdK || isSlash) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      const route = getItemRoute(item);
      const label = getItemLabel(item);
      saveHistory(label);
      setHistory(loadHistory());
      setOpen(false);
      router.push(route);
    },
    [router]
  );

  const handleHistorySelect = useCallback(
    (term: string) => {
      setQuery(term);
    },
    []
  );

  const hasQuery = query.trim().length >= 3;
  const hasResults =
    data &&
    Object.values(data.results).some((arr) => arr.length > 0);

  const categoryOrder: SearchResultKind[] = [
    "pagina",
    "guia",
    "entidade",
    "vaga",
    "disciplina",
    "curso",
    "usuario",
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Pesquisar no Aquario..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/* Loading state */}
        {hasQuery && isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Buscando...
          </div>
        )}

        {/* No results */}
        {hasQuery && !isLoading && !hasResults && (
          <CommandEmpty>
            Nenhum resultado para &quot;{query.trim()}&quot;
          </CommandEmpty>
        )}

        {/* Results grouped by category */}
        {hasQuery &&
          !isLoading &&
          data &&
          categoryOrder.map((kind) => {
            const items = data.results[
              `${kind === "pagina" ? "paginas" : kind === "guia" ? "guias" : kind === "entidade" ? "entidades" : kind === "vaga" ? "vagas" : kind === "disciplina" ? "disciplinas" : kind === "curso" ? "cursos" : "usuarios"}`
            ] as SearchResultItem[];

            if (!items || items.length === 0) return null;

            const config = CATEGORY_CONFIG[kind];
            const Icon = config.icon;

            return (
              <CommandGroup key={kind} heading={config.label}>
                {items.map((item) => (
                  <CommandItem
                    key={`${item.kind}-${item.id}`}
                    value={`${item.kind}-${item.id}-${getItemLabel(item)}`}
                    onSelect={() => handleSelect(item)}
                  >
                    <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {highlightMatch(getItemLabel(item), query)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}

        {/* History (shown when no query) */}
        {!hasQuery && history.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recentes">
              {history.map((term) => (
                <CommandItem
                  key={`history-${term}`}
                  value={`history-${term}`}
                  onSelect={() => handleHistorySelect(term)}
                >
                  <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{term}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/shared/search/
git commit -m "feat(search): add command palette UI components"
```

---

## Task 9: Integrate Search into NavBar and HamburgerMenu

**Files:**
- Modify: `src/components/shared/nav-bar.tsx`
- Modify: `src/components/shared/hamburguer-menu.tsx`

**Step 1: Add SearchCommand + SearchTrigger to NavBar**

In `src/components/shared/nav-bar.tsx`:

Add imports at the top:
```typescript
import { SearchCommand } from "@/components/shared/search/search-command";
import { SearchTrigger } from "@/components/shared/search/search-trigger";
```

Modify the `NavBar` component to add search state and render both components. Add `SearchTrigger` in the right section next to `AuthSection`, and render `SearchCommand` once at root level.

Inside the `NavBar` component:
```typescript
export default function NavBar() {
  const { theme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme || theme) === "dark";
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-4 z-50 w-full flex justify-center">
        <div className="grid grid-cols-2 lg:grid-cols-2 items-center h-[60px] px-6 gap-4 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg w-full max-w-4xl">
          <NavLogo />
          <div className="flex items-center justify-end gap-4">
            <NavLinks isDark={isDark} />
            <SearchTrigger onClick={() => setSearchOpen(true)} />
            <AuthSection />
          </div>
        </div>
      </nav>
      <SearchCommand />
    </>
  );
}
```

Add `useState` to the React import at the top of the file.

**Step 2: Add SearchCommand + SearchTrigger to HamburgerMenu**

In `src/components/shared/hamburguer-menu.tsx`:

Add imports:
```typescript
import { Search } from "lucide-react";
import { SearchCommand } from "@/components/shared/search/search-command";
```

Add a search button in the header area (next to the hamburger icon), and render `SearchCommand` once:

In the `HamburgerMenu` component, add a search icon button in the header and `<SearchCommand />` at the end:

```typescript
// Inside the header div, before the HamburgerIcon:
<div className="flex items-center gap-2">
  <button
    onClick={() => {
      // The SearchCommand listens for Ctrl+K globally,
      // but we can trigger it by dispatching the event
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
      );
    }}
    className="p-2 text-neutral-800 dark:text-neutral-50"
    aria-label="Pesquisar"
  >
    <Search className="w-5 h-5" />
  </button>
  <HamburgerIcon isOpen={isOpen} onClick={toggleMenu} />
</div>
```

And add `<SearchCommand />` right before closing the `</nav>` tag.

**Note:** Actually, since `SearchCommand` manages its own open state via keyboard shortcut, we only need to render it once. The `SearchTrigger` in NavBar and the search button in HamburgerMenu just need to trigger the dialog open. The simplest approach is to lift the open state or dispatch a custom event. However, since `SearchCommand` already listens for `Ctrl+K`, dispatching that keyboard event works.

**Alternative (cleaner):** Add an `open` / `onOpenChange` prop to `SearchCommand` so both NavBar and HamburgerMenu can control it. But since `SearchCommand` already handles Ctrl+K internally, the simplest v1 approach is:

1. Render `<SearchCommand />` once in the root layout or nav-wrapper
2. Both NavBar's `SearchTrigger` and HamburgerMenu's search button dispatch `Ctrl+K`

**Step 3: Move SearchCommand to nav-wrapper.tsx**

Actually, the cleanest approach: render `SearchCommand` in `nav-wrapper.tsx` (which already decides between NavBar and HamburgerMenu), and have triggers dispatch the keyboard event.

In `src/components/shared/nav-wrapper.tsx`, add:

```typescript
import { SearchCommand } from "@/components/shared/search/search-command";

// In the render, add <SearchCommand /> alongside the nav component
```

**Step 4: Commit**

```bash
git add src/components/shared/nav-bar.tsx src/components/shared/hamburguer-menu.tsx src/components/shared/nav-wrapper.tsx
git commit -m "feat(search): integrate search command palette into navigation"
```

---

## Task 10: Clean Up Old SearchBar1

**Files:**
- Evaluate: `src/components/ui/searchbar1.tsx`

**Step 1: Check if SearchBar1 is used anywhere**

```bash
# Search for imports/usages of SearchBar1
grep -r "searchbar1\|SearchBar1" src/ --include="*.tsx" --include="*.ts"
```

If SearchBar1 is not imported anywhere other than its own file, it can be safely deleted. If it is used, evaluate whether to replace those usages with the new `SearchCommand` trigger.

**Step 2: Remove or keep based on findings**

If unused, delete `src/components/ui/searchbar1.tsx`.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(search): remove unused SearchBar1 component"
```

---

## Task 11: Manual Testing + Verification

**Step 1: Run type check**

```bash
npm run check-all
```

Expected: No errors.

**Step 2: Run dev server**

```bash
npm run dev
```

**Step 3: Test the search**

1. Open browser, press `Ctrl+K` — command palette should open
2. Type "lab" — should show results after 300ms debounce (if >= 3 chars, type "lab")
3. Verify categories appear in correct order (Paginas > Guias > Entidades > ...)
4. Verify empty categories are hidden
5. Type "laboratorio" (without accent) — should find "Laboratorio" results thanks to `unaccent`
6. Click a result — should navigate to correct route
7. Reopen palette — "Recentes" should show the previous search
8. Press `Esc` — palette should close
9. Test on mobile viewport — search icon in hamburger menu should open the palette

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(search): address issues found during manual testing"
```

---

## Task 12: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add entry under [Unreleased]**

```markdown
### Added
- Global search command palette (Ctrl+K) with unified search across pages, guides, entities, jobs, disciplines, courses, and user profiles
- PostgreSQL Full-Text Search with `unaccent` extension for accent-insensitive Brazilian Portuguese search
- Search results ranked by relevance with `ts_rank`
- Recent search history stored in localStorage
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update changelog with global search feature"
```
