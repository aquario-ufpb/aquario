## What changed
- Added **husky** (v9) and **lint-staged** as dev dependencies
- Created a **pre-commit hook** that runs `lint-staged` to auto-format staged files with Prettier and auto-fix ESLint issues
- Created a **pre-push hook** that runs `npm run check-all` (lint + format check + type check) before pushing
- Added `.lintstagedrc.json` config for `*.{ts,tsx}`, `*.{js,jsx,mjs}`, and `*.{json,css,scss}` files
- Removed deprecated `.husky/_` internal directory (leftover from older husky version)

## Why
Developers currently only see lint/format/type errors when CI runs on their PR. This adds local git hooks so issues are caught and auto-fixed before code leaves the developer's machine.

Fixes #158

## Testing
- All 153 existing unit tests pass (`npm run test`)
- Verified `.lintstagedrc.json` passes Prettier formatting check
- Verified husky `prepare` script was added to `package.json`
- Hook files created at `.husky/pre-commit` and `.husky/pre-push`
