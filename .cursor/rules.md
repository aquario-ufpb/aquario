# Aquário - Cursor Rules

## Project Context

University portal for UFPB (Brazil). Next.js 15 + TypeScript + Prisma + Tailwind.

## Architecture

- **App Router**: All pages in `src/app/`, API routes in `src/app/api/`
- **Lib structure**: `client/` (browser), `server/` (Node), `shared/` (both)
- **Repository pattern**: Access DB via `getContainer().xyzRepository`
- **API client**: Use `apiClient(endpoint)` - it auto-prepends API_URL

## Code Conventions

### API Services (Frontend)
```typescript
import { apiClient } from "./api-client";
import { throwApiError } from "@/lib/client/errors";

// Always use apiClient, never raw fetch()
const response = await apiClient("/endpoint", { method: "GET" });
if (!response.ok) {
  await throwApiError(response);
}
return response.json();
```

### API Routes (Backend)
```typescript
import { createApiHandler } from "@/lib/server/api/route-handler";
import { ApiError } from "@/lib/server/api/errors";

export const GET = createApiHandler(async (req) => {
  // Throw ApiError with error code for client-friendly errors
  if (!found) {
    throw new ApiError("Not found", 404, "RESOURCE_NOT_FOUND");
  }
  return NextResponse.json(data);
});
```

### Database Access
```typescript
import { getContainer } from "@/lib/server/container";

const container = getContainer();
const result = await container.usuarioRepository.findById(id);
```

## Domain Terms (Portuguese)

- Guia = Guide
- Secao = Section
- Centro = Academic Center
- Curso = Course/Major
- Entidade = Entity (orgs, labs)
- Usuario = User
- Vaga = Job listing
- Membro = Member

## Don'ts

- Don't use raw `fetch()` in frontend services - use `apiClient`
- Don't access Prisma directly - use repositories via container
- Don't put server code in `lib/client/` or vice versa
- Don't use `API_URL` prefix with apiClient - it's automatic
- Don't create in-memory implementations - we only use Prisma

## Style

- TypeScript strict mode
- Zod for validation
- React Query for data fetching
- shadcn/ui for components
- Tailwind for styling

## Commands

```bash
npm run dev           # Dev server
npm run check-all     # Lint + format + types
npm run db:migrate    # Run migrations
npm run db:studio     # Prisma Studio
```
