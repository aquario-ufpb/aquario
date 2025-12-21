# Contributing to Aquário

Thank you for your interest in contributing! 🎉

## Who Can Contribute?

**Anyone from CI-UFPB is welcome!** Whether you're a student, professor, or lab member - all contributions are valued regardless of experience level.

## Ways to Contribute

- 🐛 **Report bugs** - Open an issue with steps to reproduce
- 💡 **Suggest features** - Open an issue with your idea
- 🔧 **Submit code** - Fix bugs or implement features
- 📝 **Improve docs** - Fix typos or add examples

## Getting Started

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/aquario.git
cd aquario

# 2. Setup
./scripts/setup-submodules.sh
npm install
cp .env.example .env.local

# 3. Create a branch
git checkout -b feature/my-feature

# 4. Make changes and test
npm run dev
npm run check-all

# 5. Commit and push
git commit -m "feat: add my feature"
git push origin feature/my-feature

# 6. Open a Pull Request
```

## Development Setup

See [README-DEV.md](README-DEV.md) for detailed setup instructions.

**Quick mode without database:**

```bash
# Set in .env.local:
DB_PROVIDER=memory
```

## Code Style

### File Naming

All files use **kebab-case**: `user-profile.tsx`, `auth-service.ts`

### Language

- **Code**: English
- **UI**: Portuguese
- **Commits**: English

### Commit Format

```
type: description

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

Before submitting:

- [ ] Code follows project style (`npm run check-all` passes)
- [ ] Tests pass (`npm run test`)
- [ ] No console.logs left in code
- [ ] Tested manually

## Project Structure

```
src/
├── app/              # Pages and API routes
├── components/       # React components
└── lib/
    ├── server/       # Backend code (DB, services)
    ├── client/       # Frontend code (hooks, API)
    └── shared/       # Shared types and utils
```

## Questions?

- Open an issue on GitHub
- Email: [ralf.ferreira@academico.ufpb.br](mailto:ralf.ferreira@academico.ufpb.br)

---

**Thank you for helping make Aquário better! 🌊**
