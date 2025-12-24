# Code Style Guide

## Tools

- **Prettier** - Code formatting
- **ESLint** - Linting and code quality
- **TypeScript** - Type checking

## Commands

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format all files
npm run format:check  # Check formatting
npm run type-check    # TypeScript check
npm run check-all     # Run all checks
```

## File Naming

**All files use kebab-case:**

```
✅ user-profile.tsx
✅ use-auth.ts
✅ api-client.ts
❌ UserProfile.tsx
❌ useAuth.ts
```

## Prettier Config

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5",
  "arrowParens": "avoid"
}
```

## VS Code Setup

Install extensions:

- Prettier - Code formatter
- ESLint

Add to settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Disabling Rules

When necessary, disable rules inline:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;
```

## Before Committing

Always run:

```bash
npm run check-all
```

This ensures:

- ✅ No lint errors
- ✅ Code is formatted
- ✅ No TypeScript errors
