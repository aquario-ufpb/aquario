# Política de ambientes SIGAA V1

## Preparar os ambientes de deploy

1. Crie um projeto Neon exclusivo para testes. Renomeie a raiz para `aquario-synthetic`, com o banco vazio `neondb` e apenas o papel de aplicação `neondb_owner`. Mantenha a raiz sem tabelas, migrations ou dados. Gere uma **chave de API de projeto** restrita a esse projeto. Cada execução cria uma filha com `init_source=parent-schema`, troca a senha da filha e aplica as migrations e o seed nela. [Chaves de projeto Neon](https://neon.com/docs/manage/orgs-api)
2. Crie projetos Vercel distintos para **preview**, **staging** e **produção**. Conecte o repo ao projeto de preview e desative os deploys Git automáticos nos três projetos para que as Actions controlem a publicação e o banco de cada build. Mova o alias de staging para seu projeto. Use tokens de operadores ou equipes com acesso somente ao ambiente correspondente. Revise integrações, variáveis compartilhadas e todos os targets. O código de uma PR pode ler o ambiente de seu build e runtime. Use apenas credenciais descartáveis de teste no projeto de preview, inclusive para JWT e Blob. Mantenha tokens de CI e do conector, bancos de outros ambientes e contas privilegiadas fora dele.
3. No GitHub, restrinja os environments `nonproduction-preview` e `staging` a `main`. Restrinja o environment `production` à branch protegida `main` para a importação manual e às tags de release protegidas para deploy. Exija revisão para acessar segredos de produção. Cadastre os valores abaixo antes do primeiro deploy.
4. Na troca de ambientes, revogue chaves antigas de Neon e Vercel compartilhadas com workflows, rotacione os segredos e senhas de produção que estiveram disponíveis nos ambientes anteriores e remova as cópias em secrets do repositório ou organização acessíveis a PRs. Desative URLs de deployments antigos e retire as branches legadas com o operador responsável, depois de confirmar o novo staging. A limpeza automática atua somente em filhas criadas pela nova convenção. Revise logs e artefatos históricos conforme a política de retenção da equipe.

| Onde configurar | Nomes | Finalidade |
| --- | --- | --- |
| GitHub Actions, **variables** | `NONPROD_NEON_PROJECT_ID`, `PRODUCTION_NEON_PROJECT_ID`, `PREVIEW_VERCEL_PROJECT_ID`, `STAGING_VERCEL_PROJECT_ID`, `PRODUCTION_VERCEL_PROJECT_ID` | Identificar os destinos e detectar projetos compartilhados. IDs podem ser visíveis ao CI. |
| Cada environment `nonproduction-preview` e `staging` | Variable `NONPROD_VERCEL_ORG_ID`. Secrets `NONPROD_NEON_API_KEY` e `NONPROD_VERCEL_TOKEN` | Equipe da Vercel e chaves exclusivas do ambiente. A chave Neon tem escopo do projeto de testes. |
| Environment `staging`, **secrets** | `STAGING_SIGAA_REAUTH_JWT_SECRET`, `STAGING_SIGAA_CONNECTOR_URL`, `STAGING_SIGAA_CONNECTOR_ALLOWED_ORIGINS`, `STAGING_SIGAA_CONNECTOR_API_SECRET` | Acesso ao conector de staging no deployment promovido. |
| Environment `production`, **secrets** | `PRODUCTION_VERCEL_TOKEN`, `PRODUCTION_VERCEL_ORG_ID`, `PRODUCTION_VERCEL_PROJECT_ID`, `PRODUCTION_NEON_API_KEY`, `PRODUCTION_NEON_PROJECT_ID` | Publicação da release e importação manual de entidade. |

A configuração de `DATABASE_URL` de produção na Vercel pertence somente ao target Production do projeto de produção. Mantenha a configuração local em um banco de desenvolvimento. A URL da filha de preview é temporária e específica da branch Git. O seed padrão em `prisma/seed.ts` carrega o catálogo público e exemplos. Não acrescente contas administrativas, senhas ou matrículas de teste reais ao seed de CI.

## Preview

PRs do próprio repositório para `main` recebem uma URL quando o build remoto do SHA da PR termina. A Action usa o workflow e o script da base. A Vercel recebe o código da PR e as credenciais da filha correspondente. Ao atualizar a PR, a Action mantém o banco anterior até o novo build ficar pronto. Fechar a PR limpa bancos gerenciados e a variável de branch.

Deployments de PR mantêm o conector SIGAA desabilitado. O carregador server-only rejeita o conector quando `VERCEL_ENV=preview`, exceto no deployment de staging identificado.

## Staging

Um push para `main` ou uma execução manual nessa branch cria um banco de staging com migrations e seed. Os segredos do conector entram apenas no deployment de staging. O banco anterior é retirado depois de verificar que o alias aponta para o novo deployment. Uma falha ambígua durante a promoção mantém o banco disponível até a próxima promoção bem-sucedida.

## Produção

O endpoint do conector usa função de até 150 segundos. O cliente server-only do Aquário espera até
165 segundos. A rota de sincronização reserva até 180 segundos. Um encerramento forçado pode impedir
blocos `finally`, portanto a garantia pública se limita a não persistir nem reutilizar credenciais ou
sessões.

`CRON_SECRET` autoriza a limpeza diária de tentativas finalizadas com retenção vencida. O job não
recebe credenciais do SIGAA nem o bearer do conector, e a configuração rejeita qualquer reutilização
entre esses segredos.

O backend do Aquário fixa suas funções em `iad1`. Antes do smoke real, os resumos dos deployments do
Aquário e do conector devem confirmar `iad1`, além dos limites de 180 e 150 segundos. O timeout do
cliente server-only permanece em 165 segundos.

## Desenvolvimento local (Linux)

O Aquário e o conector são dois processos separados. O seed de cursos não inicia o conector.

Clone `https://github.com/aquario-ufpb/aquario-sigaa-connector.git` ao lado do Aquário e instale o serviço com Python 3.12:

```bash
cd ../aquario-sigaa-connector
python3.12 -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
```

No `.env` privado do conector, defina `CONNECTOR_API_SECRET` com uma chave aleatória de pelo menos 32 caracteres. No `.env` do Aquário, configure:

```dotenv
SIGAA_CONNECTOR_URL="http://127.0.0.1:8000/v1/sync"
SIGAA_CONNECTOR_ALLOWED_ORIGINS="http://127.0.0.1:8000"
SIGAA_CONNECTOR_ALLOW_LOCAL_HTTP="true"
SIGAA_CONNECTOR_API_SECRET="mesmo-valor-de-CONNECTOR_API_SECRET"
```

Mantenha `JWT_SECRET` e `SIGAA_REAUTH_JWT_SECRET` distintos entre si e da chave do conector. Nenhum desses valores usa prefixo `NEXT_PUBLIC_`.

Inicie o conector em um terminal:

```bash
cd ../aquario-sigaa-connector
.venv/bin/python -m uvicorn api.index:app --env-file .env --host 127.0.0.1 --port 8000 --no-access-log
```

Em outro terminal, inicie o Aquário na pasta do aplicativo:

```bash
npm run dev -- --port 3031
```

`GET http://127.0.0.1:8000/health` deve retornar `status: "ok"` e `schema_version: "1.0"`. Esse teste confirma a inicialização; a importação real precisa ser feita pela tela `/me/academico`, com reautenticação da conta Aquário, consentimento e credenciais SIGAA informadas diretamente pelo usuário. Não coloque credenciais SIGAA em arquivos `.env` ou comandos de terminal.

O HTTP local é aceito somente com `NODE_ENV=development`. `npm start` executa em produção e exige conector HTTPS.
