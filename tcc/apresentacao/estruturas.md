# Árvores de estrutura para os slides

Todas conferidas contra a tag `v1.8.0`, que é a versão da data-base.
No fim há a nota sobre como levar isso para o Beamer.

---

## 1. Documentação e governança

Tudo que um colaborador lê antes de escrever a primeira linha.

```
aquario/
├── README.md                            o que é o projeto e como rodar
├── README-DEV.md                        detalhes de ambiente e convenções
├── CONTRIBUTING.md                      como abrir PR, padrão de commit, revisão
├── CODE_OF_CONDUCT.md                   conduta da comunidade
├── SECURITY.md                          como reportar vulnerabilidade
├── CHANGELOG.md                         histórico das 27 releases (SemVer)
├── LICENSE                              MIT
├── REPLICANDO_NA_SUA_UNIVERSIDADE.md    guia para outro centro adotar
│
├── .claude/CLAUDE.md                    contexto do projeto p/ ferramentas de IA
├── .cursor/rules.md                     versão enxuta das mesmas regras
└── .agents/skills/                      instruções reutilizáveis (fonte única)
```

**Variação enxuta**, se o slide ficar cheio:

```
aquario/
├── README.md · README-DEV.md            entrada e ambiente
├── CONTRIBUTING.md · CODE_OF_CONDUCT.md · SECURITY.md
├── CHANGELOG.md                         27 releases, versionamento semântico
├── LICENSE                              MIT
└── REPLICANDO_NA_SUA_UNIVERSIDADE.md    replicação por outros centros
```

---

## 2. Monorepo

O argumento é que interface e serviço vivem no mesmo lugar — a árvore
precisa deixar isso visível. Note `app/` contendo páginas **e** `api/`.

```
aquario/
├── src/
│   ├── app/                 App Router — páginas e rotas de serviço juntas
│   │   ├── entidades/         página
│   │   ├── grades-curriculares/
│   │   ├── mapas/
│   │   └── api/               rotas de serviço (mesma árvore)
│   │       ├── entidades/
│   │       ├── projetos/
│   │       └── auth/
│   │
│   ├── components/          UI — pages/, shared/, ui/
│   ├── lib/
│   │   ├── client/            hooks React Query e chamadas de API
│   │   ├── server/            repositórios, serviços, container de DI
│   │   └── shared/            tipos, validação Zod, constantes
│   ├── analytics/           catálogo tipado de 37 eventos
│   └── contexts/ providers/
│
├── prisma/                  schema, migrações e seed
├── content/                 conteúdo versionado (3 submódulos + 3 pastas)
└── .github/workflows/       CI/CD
```

**Variação só das camadas**, se quiser focar no argumento de arquitetura:

```
src/lib/
├── client/     roda no navegador — hooks, chamadas de API
├── server/     roda no servidor — repositórios, serviços, container
└── shared/     os dois lados — tipos, validação, constantes
```

---

## 3. Workflows de CI/CD

Nove workflows, que se dividem em três funções.

```
.github/workflows/
│
├── verificação a cada pull request
│   ├── tests.yml                     Jest e Vitest
│   └── code-quality.yml              ESLint, Prettier, tsc
│
├── ambientes
│   ├── preview.yml                   URL única por PR + banco Neon isolado
│   ├── staging.yml                   a cada merge na principal
│   └── production.yml                a cada release publicada
│
└── conteúdo
    ├── update-guias-submodule.yml
    ├── update-entidades-submodule.yml
    ├── update-mapas-submodule.yml
    └── update-paas-data.yml
```

**Variação linear**, sem os agrupamentos:

```
.github/workflows/
├── tests.yml                       testes a cada push e PR
├── code-quality.yml                lint, formatação e tipos
├── preview.yml                     ambiente por PR, com banco isolado
├── staging.yml                     promove a staging no merge
├── production.yml                  publica em produção na release
├── update-guias-submodule.yml
├── update-entidades-submodule.yml
├── update-mapas-submodule.yml
└── update-paas-data.yml
```

---

## Levando para o Beamer

Os caracteres `├ └ │ ─` são Unicode e **não renderizam** no pdfLaTeX com a
configuração atual dos slides. Duas saídas:

**A — ASCII puro**, dentro de `\begin{semiverbatim}` ou `verbatim`:

```
aquario/
|-- src/
|   |-- app/          paginas e rotas de servico
|   `-- lib/
|       |-- client/
|       |-- server/
|       `-- shared/
|-- prisma/
`-- .github/workflows/
```

**B — pacote `dirtree`**, que desenha as linhas de verdade. No preâmbulo:

```latex
\usepackage{dirtree}
```

E no slide:

```latex
\dirtree{%
.1 aquario/.
.2 src/.
.3 app/ \nota{páginas e rotas de serviço}.
.3 lib/.
.4 client/.
.4 server/.
.4 shared/.
.2 prisma/.
.2 .github/workflows/.
}
```

O `dirtree` aceita acento e comandos de formatação, o que o `verbatim` não
aceita — é a opção melhor se você quiser cor ou notas ao lado.

Me diga qual variação de cada uma você quer e eu já monto no `slides.tex`.
