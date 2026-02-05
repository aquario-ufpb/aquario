# Aquário - AI Assistant Guidelines

## Project Overview

Aquário is a university portal for UFPB (Universidade Federal da Paraíba) students. It provides guides, job listings, entity directories, and user profiles.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 18
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query (React Query) for server state
- **Auth**: JWT tokens with automatic refresh

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API route handlers
│   └── (pages)/           # Page components
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   └── [feature]/        # Feature-specific components
├── lib/
│   ├── client/           # Client-side code (runs in browser)
│   │   ├── api/          # API service functions (use apiClient)
│   │   ├── hooks/        # React hooks
│   │   └── errors.ts     # Client error handling (throwApiError)
│   ├── server/           # Server-side code (runs on server only)
│   │   ├── api/          # API route utilities
│   │   ├── container/    # Dependency injection container
│   │   ├── db/           # Database repositories (Prisma)
│   │   └── services/     # Business logic services
│   └── shared/           # Code shared between client and server
│       ├── types/        # TypeScript types and interfaces
│       ├── errors/       # Error codes and types
│       └── config/       # Constants and configuration
```

## Key Patterns

### API Client
All frontend API calls use `apiClient` from `@/lib/client/api/api-client`. It automatically:
- Prepends the API_URL
- Handles JWT token injection
- Refreshes tokens on 401 errors

```typescript
// Correct - just pass the endpoint
const response = await apiClient("/guias", { method: "GET" });

// Wrong - don't include API_URL
const response = await apiClient(`${API_URL}/guias`, ...);
```

### Error Handling
- **Backend**: Throw `ApiError` from `@/lib/server/api/errors` with machine-readable `ErrorCode`
- **Frontend**: Use `throwApiError(response)` to convert API errors to exceptions

```typescript
// Backend route
if (!user) {
  throw new ApiError("User not found", 404, "USER_NOT_FOUND");
}

// Frontend service
if (!response.ok) {
  await throwApiError(response);
}
```

### Repository Pattern
Database access uses repositories via dependency injection:

```typescript
import { getContainer } from "@/lib/server/container";

const container = getContainer();
const user = await container.usuarioRepository.findById(id);
```

### API Routes
Use the `createApiHandler` wrapper for consistent error handling:

```typescript
import { createApiHandler } from "@/lib/server/api/route-handler";

export const GET = createApiHandler(async (req) => {
  // Your logic here
  return NextResponse.json(data);
});
```

## Domain Terminology (Portuguese)

The codebase uses Portuguese for domain terms:
- `Guia` = Guide
- `Secao` = Section
- `SubSecao` = Subsection
- `Centro` = Academic Center
- `Curso` = Course/Major
- `Entidade` = Entity (student organizations, labs, etc.)
- `Usuario` = User
- `Vaga` = Job listing
- `Membro` = Member

## Code Style

- Use TypeScript strict mode
- Prefer `type` over `interface` for object types
- Use Zod for runtime validation
- Keep components focused and small
- Use React Query for data fetching, not useEffect

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run check-all    # Run lint + format check + type check
npm run db:migrate   # Create/run database migrations
npm run db:studio    # Open Prisma Studio
npm run setup        # First-time project setup
```

## Testing

- **Unit tests**: Jest (`npm run test`)
- **Integration tests**: Vitest (`npm run test:integration`)
- **All tests**: `npm run test:all`

## Changelog

**Always update `CHANGELOG.md` when completing work.** Add entries under `[Unreleased]` in the appropriate category:

- **Added** — New features
- **Changed** — Changes in existing functionality
- **Removed** — Removed features
- **Fixed** — Bug fixes

Keep entries concise but descriptive. Reference the feature/component affected.
