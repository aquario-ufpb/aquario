# Replicando o Aquário na sua Universidade

Quer levar o Aquário para a sua universidade? Este guia explica como colocar tudo no ar, do zero, usando **serviços gratuitos**.

O Aquário foi pensado para ser replicado. Toda a infraestrutura roda em free tiers — você não precisa gastar nada para ter uma instância funcionando em produção.

**Pré-requisitos:**
- Conhecimento básico de Git e terminal
- Uma conta no GitHub
- Disposição para configurar alguns serviços online (leva ~1h no total)

> **Desenvolvedor?** Para rodar o projeto localmente, veja o [README-DEV.md](README-DEV.md).

---

## Visão Geral da Arquitetura

```mermaid
graph TD
    A[Usuarios] --> B[Vercel - Next.js App]
    B --> C[Neon - PostgreSQL]
    B --> D[Vercel Blob - Storage]
    B --> E[Resend - Email]
    B -.-> F[PostHog - Analytics]
    G[UptimeRobot] -.-> B

    style F stroke-dasharray: 5 5
    style G stroke-dasharray: 5 5
```

> Linhas tracejadas = servicos opcionais.

**Como funciona:**
- **Next.js** roda como full-stack — as API routes funcionam como backend
- **Prisma ORM** gerencia o banco PostgreSQL
- **JWT** cuida da autenticação (login via email com código)
- **Vercel Blob** armazena uploads de imagens (fotos de perfil, logos)
- **Resend** envia emails transacionais (verificação, login)

---

## Serviços Necessários

| Servico | Funcao | Obrigatorio? | Free Tier |
|---------|--------|:------------:|-----------|
| **GitHub** | Codigo + CI/CD | Sim | Ilimitado (repositorio publico) |
| **Vercel** | Hosting (frontend + API) | Sim | Hobby plan gratuito |
| **Neon** | Banco PostgreSQL | Sim | 0.5 GB gratuito |
| **Vercel Blob** | Upload de arquivos | Sim | Incluido no Hobby plan |
| **Resend** | Emails transacionais | Sim | 3.000 emails/mes |
| **PostHog** | Analytics | Nao | 1M eventos/mes |
| **UptimeRobot** | Monitoramento | Nao | 50 monitores |
| **Dominio personalizado** | URL bonita | Nao | ~R$40/ano |

---

## Passo a Passo

### 1. GitHub — Fork e Organizacao

**1.1.** Crie uma organizacao no GitHub para sua universidade:
- Acesse https://github.com/organizations/plan
- Escolha o plano **Free**
- Sugestao de nome: `aquario-<sigla>` (ex: `aquario-ufrj`, `aquario-usp`)

**1.2.** Faca o fork do repositorio principal:
- Acesse https://github.com/aquario-ufpb/aquario
- Clique em **Fork** e selecione sua organizacao como destino

**1.3.** Faca o fork dos repositorios de conteudo:

**Submodules (Git)** — referenciados no `.gitmodules`, precisam de fork:

| Repositorio | Conteudo |
|-------------|----------|
| [aquario-guias](https://github.com/aquario-ufpb/aquario-guias) | Guias academicos em Markdown |
| [aquario-entidades](https://github.com/aquario-ufpb/aquario-entidades) | Laboratorios, grupos e entidades (JSON) |
| [aquario-mapas](https://github.com/aquario-ufpb/aquario-mapas) | Mapas do campus |
| [aquario-vagas](https://github.com/aquario-ufpb/aquario-vagas) | Vagas e oportunidades |

**Diretorios de conteudo** — vivem dentro de `content/`, nao sao submodules:

| Diretorio | Conteudo | Observacao |
|-----------|----------|------------|
| `content/aquario-curriculos` | Grades curriculares (CSV) | Editar diretamente no fork |
| `content/aquario-paas` | Dados do PAAS/SACI (JSON) | Atualizado automaticamente via workflow; especifico da UFPB — pode remover ou adaptar para o sistema da sua universidade |

**Repositorio auxiliar (opcional):**

| Repositorio | Conteudo | Observacao |
|-------------|----------|------------|
| [aquario-stats](https://github.com/trindadetiago/aquario-stats) | Imagens de ranking de contribuidores | Usado no README para exibir top contributors. Se quiser manter, crie seu proprio repositorio de stats |

**1.4.** Atualize as URLs dos submodules no seu fork:

Edite o arquivo `.gitmodules` na raiz do projeto, trocando `aquario-ufpb` pela sua organizacao:

```gitmodules
[submodule "content/aquario-guias"]
	path = content/aquario-guias
	url = https://github.com/<sua-org>/aquario-guias.git
[submodule "content/aquario-entidades"]
	path = content/aquario-entidades
	url = https://github.com/<sua-org>/aquario-entidades.git
[submodule "content/aquario-mapas"]
	path = content/aquario-mapas
	url = https://github.com/<sua-org>/aquario-mapas.git
[submodule "content/aquario-vagas"]
	path = content/aquario-vagas
	url = https://github.com/<sua-org>/aquario-vagas
```

Depois, execute:

```bash
git submodule sync
git submodule update --init --recursive
```

---

### 2. Neon — Banco de Dados

O Neon fornece PostgreSQL serverless com um free tier generoso (0.5 GB).

**2.1.** Crie uma conta em https://neon.tech e crie um novo projeto.

**2.2.** Na dashboard do projeto, copie a **connection string**. Ela tera este formato:

```
postgresql://neondb_owner:abc123@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Guarde esse valor — ele sera a variavel `DATABASE_URL`.

**2.3.** Para o CI/CD funcionar (preview deployments automaticos), voce tambem vai precisar de:

- **`NEON_API_KEY`**: Acesse *Account Settings > API Keys* no painel do Neon
- **`NEON_PROJECT_ID`**: Visivel na URL da dashboard do seu projeto (ex: `crimson-frog-12345678`)

---

### 3. Vercel — Hosting

A Vercel hospeda a aplicacao Next.js (frontend + API) e faz deploys automaticos.

**3.1.** Crie uma conta em https://vercel.com (use login com GitHub).

**3.2.** Importe o repositorio:
- Clique em **Add New > Project**
- Selecione o fork do Aquario na sua organizacao
- Framework: **Next.js** (detectado automaticamente)

**3.3.** Configure as variaveis de ambiente. Na aba **Settings > Environment Variables**, adicione:

| Variavel | Valor | Ambiente |
|----------|-------|----------|
| `DATABASE_URL` | Connection string do Neon | Production, Preview, Development |
| `JWT_SECRET` | String aleatoria de 32+ caracteres* | Production, Preview |
| `RESEND_API_KEY` | Chave da API do Resend (passo 5) | Production, Preview |
| `EMAIL_FROM` | `noreply@seudominio.com` | Production, Preview |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob (passo 4) | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://seudominio.com` | Production |
| `NEXT_PUBLIC_IS_STAGING` | `true` | Preview |
| `MASTER_ADMIN_EMAILS` | `seu@email.com` | Production, Preview |
| `NEXT_PUBLIC_GUIAS_DATA_PROVIDER` | `backend` | Production, Preview |

> *Gere um JWT_SECRET seguro com: `openssl rand -base64 32`

**3.4.** Para o CI/CD, voce vai precisar de tres valores da Vercel:

- **`VERCEL_TOKEN`**: Acesse *Settings > Tokens* em https://vercel.com/account/tokens
- **`VERCEL_ORG_ID`**: Visivel em *Settings > General* do seu time/conta
- **`VERCEL_PROJECT_ID`**: Visivel em *Settings > General* do projeto

> **Como funciona o deploy:** push para `main` deploya para staging. Criar um GitHub Release deploya para producao.

---

### 4. Vercel Blob — Storage

O Vercel Blob armazena uploads de imagens (fotos de perfil, logos de entidades).

**4.1.** No painel do seu projeto na Vercel, va em **Storage > Create Database > Blob**.

**4.2.** Crie um novo Blob store e conecte ao seu projeto.

**4.3.** O token `BLOB_READ_WRITE_TOKEN` sera adicionado automaticamente as variaveis de ambiente do projeto. Caso precise do valor manualmente, copie-o na aba do Blob store.

---

### 5. Resend — Email

O Resend envia emails de verificacao e login. No free tier, voce tem 3.000 emails por mes.

**5.1.** Crie uma conta em https://resend.com.

**5.2.** Acesse **API Keys** e gere uma nova chave. Guarde o valor — sera a variavel `RESEND_API_KEY`.

**5.3.** Configure o remetente (`EMAIL_FROM`):
- **Sem dominio proprio**: Use o remetente padrao `onboarding@resend.dev` (limitado, bom para testes)
- **Com dominio proprio**: Adicione e verifique seu dominio em **Domains** no painel do Resend. Depois use `noreply@seudominio.com`

> **Dica:** Sem a `RESEND_API_KEY` configurada, o app roda em modo mock — emails sao logados no console e usuarios sao verificados automaticamente. Bom para desenvolvimento local.

---

### 6. PostHog — Analytics (Opcional)

O PostHog oferece analytics com 1 milhao de eventos por mes no free tier.

**6.1.** Crie uma conta em https://posthog.com.

**6.2.** No setup do projeto, copie a **Project API Key**.

**6.3.** Adicione como variavel de ambiente na Vercel:

| Variavel | Valor |
|----------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Sua Project API Key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |

> Analytics so sao coletados em producao (`NODE_ENV=production`). Em dev, ficam desabilitados automaticamente.

---

### 7. UptimeRobot — Monitoramento (Opcional)

O UptimeRobot monitora se sua instancia esta no ar e pode te alertar em caso de queda.

**7.1.** Crie uma conta em https://uptimerobot.com.

**7.2.** Adicione um novo monitor:
- **Tipo**: HTTP(s)
- **URL**: `https://seudominio.com/api/health`
- **Intervalo**: 5 minutos

**7.3.** (Opcional) Atualize o badge no `README.md` do seu fork com o ID do monitor:

```markdown
[![Production](https://img.shields.io/uptimerobot/status/<seu-monitor-id>?label=production)](https://stats.uptimerobot.com/<sua-pagina>)
```

---

### 8. Dominio Personalizado (Opcional)

Um dominio proprio (ex: `aquarioufrj.com`) da um toque profissional.

**8.1.** Compre um dominio em qualquer registrar (Hostinger, Cloudflare, GoDaddy, etc.).

**8.2.** No painel do projeto na Vercel, va em **Settings > Domains** e adicione seu dominio.

**8.3.** Configure os registros DNS conforme instruido pela Vercel (geralmente um registro `CNAME` apontando para `cname.vercel-dns.com`).

**8.4.** Atualize as variaveis de ambiente:
- `NEXT_PUBLIC_APP_URL`: `https://seudominio.com`

**8.5.** Se quiser emails enviados do seu dominio:
- Adicione e verifique o dominio no Resend (passo 5.3)
- Atualize `EMAIL_FROM`: `noreply@seudominio.com`

---

## Configurando o CI/CD

O Aquario usa GitHub Actions para CI/CD automatizado. Para tudo funcionar, voce precisa configurar os **secrets** do repositorio.

### GitHub Secrets Necessarios

Va em **Settings > Secrets and variables > Actions** no seu repositorio e adicione:

| Secret | Onde obter | Usado por |
|--------|-----------|-----------|
| `VERCEL_TOKEN` | Vercel > Account Settings > Tokens | Preview, Staging, Production |
| `VERCEL_ORG_ID` | Vercel > Settings > General | Preview, Staging, Production |
| `VERCEL_PROJECT_ID` | Vercel > Project > Settings > General | Preview, Staging, Production |
| `NEON_API_KEY` | Neon > Account Settings > API Keys | Preview, Staging |
| `NEON_PROJECT_ID` | URL da dashboard do Neon | Preview, Staging |
| `TOKEN_PAT` | GitHub > Settings > Developer settings > Personal access tokens | Atualizacao de submodules (opcional) |

### Workflows e o que fazem

| Workflow | Trigger | O que faz |
|----------|---------|-----------|
| **code-quality** | Push/PR para `main` | Lint, formatacao, type-check, build |
| **tests** | Push/PR para `main` | Testes unitarios (Jest) e integracao (Vitest) |
| **preview** | PR aberto/atualizado | Cria branch no Neon + deploy de preview na Vercel |
| **staging** | Push para `main` | Reseta staging no Neon + deploy para staging |
| **production** | GitHub Release criado | Deploy para producao na Vercel |
| **update-*-submodule** | Manual (workflow dispatch) | Atualiza submodules de conteudo |
| **update-paas-data** | Semanal (seg 2h UTC) ou manual | Atualiza dados do PAAS |

### Como funcionam os ambientes

```
PR aberto/atualizado
  → Branch isolado no Neon (seed data apenas)
  → Deploy de preview com URL unica

PR mergeado em main
  → Staging resetado no Neon
  → Deploy para staging (staging.seudominio.com)

Release criado no GitHub
  → Migrations rodam no banco de producao
  → Deploy para producao (seudominio.com)
```

---

## Adaptando o Conteudo para sua Universidade

### Dados de referencia (seed)

O arquivo `prisma/seed.ts` contem os dados iniciais do banco: campus, centros, cursos, guias de exemplo e calendario academico. Voce **precisa** edita-lo para sua universidade.

**O que alterar:**

1. **Campus**: Troque `"Campus I - Joao Pessoa"` pelo nome do seu campus.

2. **Centro**: Troque `"Centro de Informatica"` / sigla `"CI"` pelo seu centro/instituto.

3. **Cursos**: Troque os cursos (Ciencia da Computacao, Engenharia da Computacao, etc.) pelos cursos da sua universidade.

4. **Calendario academico**: Atualize os semestres letivos e eventos (feriados, matriculas, exames) para o calendario da sua universidade.

Depois de editar, rode:

```bash
npm run db:seed
```

### Repositorios de conteudo

Cada submodule tem seu proprio formato:

#### Entidades (`aquario-entidades`)

Cada entidade e um arquivo JSON:

```json
{
  "name": "Nome do Lab/Grupo",
  "subtitle": "Descricao curta",
  "description": "Descricao longa em texto",
  "tipo": "LABORATORIO",
  "imagePath": "./assets/logo.png",
  "contato_email": "lab@universidade.br",
  "instagram": "https://instagram.com/lab",
  "linkedin": "https://linkedin.com/company/lab",
  "website": "https://lab.universidade.br",
  "location": "Bloco X, Sala Y",
  "foundingDate": "2020-01-01"
}
```

Tipos validos: `LABORATORIO`, `GRUPO`, `LIGA_ACADEMICA`, `EMPRESA`, `ATLETICA`, `CENTRO_ACADEMICO`, `OUTRO`.

#### Guias (`aquario-guias`)

Guias sao escritos em Markdown, organizados por curso. A estrutura de pastas e secoes e lida pelo backend e exibida no app.

#### Mapas (`aquario-mapas`)

Mapas do campus. Adicione imagens e dados de geolocalizacao dos predios da sua universidade.

#### Curriculos

Curriculos sao carregados via arquivos CSV com o seguinte formato:

| Coluna | Descricao |
|--------|-----------|
| `course_name` | Nome do curso (deve bater com o mapeamento no seed) |
| `curriculum_code` | Codigo do curriculo |
| `discipline_code` | Codigo da disciplina |
| `discipline_name` | Nome da disciplina |
| `period` | Periodo recomendado (ex: "1", "2") |
| `type` | Natureza: "Obrigatoria", "Optativa" ou "Complementar Flexiva" |
| `workload_total` | Carga horaria total |
| `theory_hours` | Horas de teoria |
| `practice_hours` | Horas de pratica |
| `department` | Departamento |
| `modality` | Modalidade |
| `prerequisites` | Pre-requisitos (codigos separados por `;`) |
| `equivalences` | Equivalencias (codigos separados por `;`) |
| `syllabus` | Ementa |

---

## Personalizando a Plataforma

### Branding basico

Para trocar o nome e a identidade visual:

1. **Logo**: Substitua o arquivo `assets/logo.png`
2. **Nome/referencias**: Busque por `UFPB`, `aquarioufpb`, `Centro de Informatica` e `CI` no codigo e substitua pelos equivalentes da sua universidade
3. **Cores**: O tema e configurado via Tailwind CSS — ajuste em `tailwind.config.ts` se quiser cores diferentes

### Configuracoes importantes

- **`MASTER_ADMIN_EMAILS`**: Lista de emails (separados por virgula) que recebem role de admin master ao se registrar. Coloque seu email aqui.
- **`NEXT_PUBLIC_APP_URL`**: URL publica do seu app. Usado para links em emails e callbacks.

---

## Checklist Final

Use esta checklist para garantir que tudo esta configurado:

### Essencial

- [ ] Fork do repositorio principal na sua organizacao
- [ ] Fork dos repositorios de conteudo (guias, entidades, mapas, vagas)
- [ ] URLs dos submodules atualizadas no `.gitmodules`
- [ ] Conta criada no Neon + projeto criado
- [ ] `DATABASE_URL` configurada
- [ ] Conta criada na Vercel + projeto importado
- [ ] `JWT_SECRET` gerado e configurado
- [ ] `BLOB_READ_WRITE_TOKEN` configurado
- [ ] Conta criada no Resend + `RESEND_API_KEY` configurada
- [ ] `EMAIL_FROM` configurado
- [ ] `NEXT_PUBLIC_APP_URL` configurado
- [ ] `MASTER_ADMIN_EMAILS` configurado com seu email
- [ ] GitHub Secrets configurados (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NEON_API_KEY`, `NEON_PROJECT_ID`)
- [ ] `prisma/seed.ts` editado com dados da sua universidade (campus, centro, cursos, calendario)
- [ ] Seed rodado com sucesso
- [ ] Primeiro deploy funcionando

### Opcional

- [ ] Dominio personalizado configurado na Vercel
- [ ] Dominio verificado no Resend
- [ ] PostHog configurado (`NEXT_PUBLIC_POSTHOG_KEY`)
- [ ] UptimeRobot monitorando `/api/health`
- [ ] Badges atualizados no README
- [ ] Conteudo adaptado (entidades, guias, mapas, curriculos)
- [ ] Referencias a UFPB substituidas no codigo
- [ ] Logo substituido

---

## Duvidas?

- Abra uma issue no [repositorio original](https://github.com/aquario-ufpb/aquario/issues)
- Mande um email para [aquarioufpb@gmail.com](mailto:aquarioufpb@gmail.com)

Boa sorte com o Aquario na sua universidade!
