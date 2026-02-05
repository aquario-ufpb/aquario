# Contributing to Aquário

Thank you for your interest in contributing! 🎉

## Who Can Contribute?

**Anyone from CI-UFPB is welcome!** Whether you're a student, professor, or lab member — all contributions are valued regardless of experience level.

## Ways to Contribute

- 🐛 **Report bugs** — Open an issue with steps to reproduce
- 💡 **Suggest features** — Open an issue with your idea
- 🔧 **Submit code** — Fix bugs or implement features
- 📝 **Improve docs** — Fix typos or add examples
- 📚 **Add content** — Contribute to guides, entity profiles, etc.

## Getting Started

**Prerequisites:**
- Node.js 18+ and npm installed ([Download Node.js](https://nodejs.org/))

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/aquario.git
cd aquario

# 2. Install dependencies
npm install

# 3. Configure environment (required before setup)
cp .env.example .env
# Edit .env if needed (default works with Docker)

# 4. Run setup (submodules, Docker, migrations)
npm run setup

# 5. Create a branch
git checkout -b feature/my-feature

# 4. Make changes and verify
npm run dev
npm run check-all

# 5. Commit and push
git commit -m "feat: add my feature"
git push origin feature/my-feature

# 6. Open a Pull Request
```

> 📖 See [README-DEV.md](README-DEV.md) for detailed setup and architecture docs.

## Development Modes

**Full Stack (with Database):**

```bash
docker-compose up -d
npm run db:migrate
npm run dev
```

> 💡 **Tip:** Email is automatically mocked when `RESEND_API_KEY` is not set. Users are auto-verified in dev mode.

## Code Standards

### File Naming

All files use **kebab-case**:

```
✅ user-profile.tsx
✅ use-auth.ts
❌ UserProfile.tsx
❌ useAuth.ts
```

### Language Convention

| Context | Language   |
| ------- | ---------- |
| Code    | English    |
| UI Text | Portuguese |
| Commits | English    |

### Commit Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type: short description

feat: add search functionality
fix: resolve login error
docs: update README
refactor: simplify auth flow
test: add user tests
chore: update deps
```

### Branch Naming

```
type/description

feature/user-auth
fix/login-validation
docs/update-readme
```

## Pull Request Checklist

Before submitting your PR, ensure:

- [ ] `npm run check-all` passes (lint, format, types)
- [ ] Tests pass (`npm run test`)
- [ ] No `console.log` statements left in code
- [ ] Tested manually in browser
- [ ] Updated CHANGELOG.md if applicable

## Project Structure

```
aquario/
├── src/
│   ├── app/           # Next.js pages and API routes
│   ├── components/    # React components
│   └── lib/
│       ├── server/    # Backend code (DB, services)
│       ├── client/    # Frontend code (hooks, API)
│       └── shared/    # Shared types and utils
├── content/           # Git submodules (guias, entidades, etc.)
├── prisma/            # Database schema
└── tests/             # E2E tests
```

## Questions?

- 💬 Open an issue on GitHub
- 📧 Email: [aquarioufpb@gmail.com](mailto:aquarioufpb@gmail.com)

---

**Thank you for helping make Aquário better! 🌊**
