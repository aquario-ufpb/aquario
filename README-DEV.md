# 🚀 Aquário - Guia de Desenvolvimento

Este é o guia principal para desenvolvedores do projeto Aquário. Aqui você encontrará uma visão geral da arquitetura, padrões estabelecidos e links para documentação específica de cada módulo.

## 📋 Visão Geral do Projeto

O Aquário é uma plataforma acadêmica desenvolvida para conectar estudantes, professores e pesquisadores do Centro de Informática da UFPB. A plataforma facilita a colaboração, compartilhamento de conhecimento e descoberta de oportunidades acadêmicas.

### 🏗️ Arquitetura Geral

```
aquario/
├── frontend/          # Next.js App (Port 3000)
│   ├── README.md     # Visão geral do frontend
│   └── README-DEV.md # Guia técnico do frontend
├── backend/           # Node.js API (Port 3001)
│   ├── README.md     # Visão geral do backend
│   └── README-DEV.md # Guia técnico do backend
└── README-DEV.md     # Este arquivo (guia principal)
```

## 🎯 Documentação por Módulo

### Frontend (Next.js)

- **📖 [README.md](frontend/README.md)** - Visão geral, tecnologias e convenções
- **🔧 [README-DEV.md](frontend/README-DEV.md)** - Guia técnico completo para desenvolvimento

### Backend (Node.js + Prisma)

- **📖 [README.md](backend/README.md)** - Visão geral da arquitetura DDD
- **🔧 [README-DEV.md](backend/README-DEV.md)** - Guia técnico completo para desenvolvimento

## 🏛️ Arquitetura e Padrões

### Frontend Architecture

- **Framework**: Next.js 14 com App Router
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Estado**: React Context + useState/useReducer
- **Testes**: Jest (unit) + Vitest (integration) + Playwright (E2E)

### Backend Architecture

- **Framework**: Node.js + Express
- **Linguagem**: TypeScript
- **Arquitetura**: Domain-Driven Design (DDD)
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Testes**: Jest + Supertest

## 🏛️ Arquitetura e Padrões

### Frontend Architecture

- **Framework**: Next.js 14 com App Router
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Estado**: React Context + useState/useReducer
- **Testes**: Jest (unit) + Vitest (integration) + Playwright (E2E)

### Backend Architecture

- **Framework**: Node.js + Express
- **Linguagem**: TypeScript
- **Arquitetura**: Domain-Driven Design (DDD)
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Testes**: Jest + Supertest

### Padrões Estabelecidos

**Importante**: Sempre seguir os padrões e convenções estabelecidos em cada módulo:

- **Frontend**: Ver [README-DEV.md](frontend/README-DEV.md) para convenções de componentes, nomenclatura e estrutura
- **Backend**: Ver [README-DEV.md](backend/README-DEV.md) para arquitetura DDD, convenções e padrões

### Idioma do Código

- **Código**: Inglês (variáveis, funções, comentários técnicos)
- **Documentação**: Português brasileiro
- **Commits**: Inglês
- **Interface**: Português brasileiro

## 🛠️ Ferramentas de Qualidade

### Configurações Implementadas

#### Frontend

- **ESLint** - Análise estática de código
- **Prettier** - Formatação automática
- **TypeScript** - Verificação de tipos

#### Backend

- **ESLint** - Análise estática de código
- **Prettier** - Formatação automática
- **TypeScript** - Verificação de tipos
- **Prisma** - Validação de schema

### Testes Configurados

#### Frontend

- **Jest** - Testes unitários
- **Vitest** - Testes de integração
- **Playwright** - Testes end-to-end (E2E)
- **Testing Library** - Utilitários para testes React

#### Backend

- **Jest** - Testes unitários e integração
- **Supertest** - Testes de API

## 🚀 Início Rápido para Desenvolvedores

### Pré-requisitos Globais

- **Node.js** 18+
- **npm** 9+
- **Git**
- **Docker Desktop** (para backend)

### Setup Completo

```bash
# 1. Clonar repositório
git clone <repository-url>
cd aquario

# 2. Inicializar e atualizar submodules
./scripts/setup-submodules.sh

# 3. Setup do Backend
cd backend
npm install
npm run setup  # Docker + DB + Migrations + Seed + Dev Server

# 4. Setup do Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

### URLs de Desenvolvimento

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (quando rodando)

## 📋 Comandos Principais

### Desenvolvimento Diário

```bash
# Backend
cd backend
npm run dev:auto    # Setup automático + servidor dev

# Frontend
cd frontend
npm run dev         # Servidor de desenvolvimento
```

### Verificação de Qualidade

```bash
# Frontend
cd frontend
npm run check-all   # Lint + Format + Type-check

# Backend
cd backend
npm run migrate     # Validação + Migração + Geração de tipos
```

### Testes

```bash
# Frontend
cd frontend
npm run test:all    # Todos os testes (unit + integration + E2E)

# Backend
cd backend
npm test            # Testes unitários e integração
```

## 🔄 Fluxo de Desenvolvimento

### 1. **Nova Funcionalidade**

```bash
# 1. Criar branch
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver (seguindo padrões estabelecidos)
# - Frontend: Componentes em kebab-case
# - Backend: Seguir DDD (domain → application → infrastructure)

# 3. Testes
npm run test:all    # Frontend
npm test           # Backend

# 4. Verificação de qualidade
npm run check-all  # Frontend
npm run migrate    # Backend (se houver mudanças no schema)

# 5. Commit e PR
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### 2. **Mudanças no Schema (Backend)**

```bash
cd backend

# 1. Modificar prisma/schema.prisma
# 2. Executar migração
npm run migrate

# 3. Atualizar seed se necessário
npm run db:seed
```

### 3. **Novos Componentes (Frontend)**

```bash
cd frontend

# 1. Criar componente seguindo convenções
# - Arquivo: kebab-case (ex: user-profile.tsx)
# - Componente: PascalCase (ex: UserProfile)
# - Props: TypeScript tipadas

# 2. Adicionar testes
# 3. Verificar qualidade
npm run check-all
```

### 4. **Atualizar Submodules**

O projeto utiliza submodules Git para gerenciar conteúdo (guias e entidades). Para inicializar ou atualizar todos os submodules:

```bash
# Inicializa submodules (primeira vez) ou atualiza para a versão mais recente
./scripts/setup-submodules.sh
```

Este script:

- ✅ Detecta automaticamente todos os submodules configurados
- ✅ Inicializa submodules não inicializados (útil após `git clone`)
- ✅ Atualiza submodules existentes para a versão mais recente
- ✅ Funciona para todos os submodules do projeto

## 📝 Padrões de Commit

### Convenção

```
<tipo>: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos Aceitos

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação, sem mudança de código
- `refactor:` - Refatoração de código
- `test:` - Adição de testes
- `chore:` - Mudanças em build, dependências, etc.

### Exemplos

```bash
feat: adiciona sistema de busca de guias
fix: corrige erro de validação no formulário de login
docs: atualiza README com novas instruções
refactor: melhora performance do componente UserCard
test: adiciona testes para API de guias
```

## 🔍 Pull Request Template

### Checklist Obrigatório

- [ ] **Código segue padrões estabelecidos**
  - [ ] Convenções de nomenclatura respeitadas
  - [ ] Arquitetura DDD seguida (backend)
  - [ ] Componentes bem estruturados (frontend)
- [ ] **Qualidade de código**
  - [ ] Linting passa (`npm run check-all`)
  - [ ] TypeScript sem erros
  - [ ] Prettier aplicado
- [ ] **Testes**
  - [ ] Testes passam (`npm run test:all`)
  - [ ] Cobertura adequada
  - [ ] Novos testes para nova funcionalidade
- [ ] **Documentação**
  - [ ] README atualizado se necessário
  - [ ] Comentários em código complexo
- [ ] **Funcionalidade**
  - [ ] Responsivo em diferentes telas
  - [ ] Modo escuro/claro funcionando
  - [ ] Integração frontend/backend testada

### Template de PR

Para todo Pull Request, temos um template que será automaticamente aplicado. Pedimos que o utilize semrpe que possível.

## 🎯 Princípios Fundamentais

### 1. **Consistência**

- Sempre seguir os padrões estabelecidos
- Manter convenções de nomenclatura
- Usar as ferramentas de qualidade configuradas

### 2. **Qualidade**

- Testes são obrigatórios para nova funcionalidade
- Linting e formatação devem passar
- TypeScript sem erros

### 3. **Documentação**

- Código auto-documentado quando possível
- READMEs atualizados
- Comentários em lógica complexa

### 4. **Colaboração**

- Commits claros e descritivos
- PRs bem documentados
- Code review respeitoso

## 🆘 Suporte e Recursos

### Documentação Detalhada

- **Frontend**: [README-DEV.md](frontend/README-DEV.md)
- **Backend**: [README-DEV.md](backend/README-DEV.md)

---

## 🚀 Comandos de Referência Rápida

```bash
# Setup completo
./scripts/setup-submodules.sh  # Inicializar/atualizar submodules
cd backend && npm run setup
cd frontend && npm run dev

# Verificação de qualidade
cd frontend && npm run check-all
cd backend && npm run migrate

# Testes
cd frontend && npm run test:all
cd backend && npm test
```

**Bem-vindo ao desenvolvimento do Aquário! 🌊**

_Lembre-se: sempre seguir os padrões estabelecidos e manter a qualidade do código._
