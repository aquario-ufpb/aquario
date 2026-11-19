# Política de ambientes SIGAA V1

## Preview

Deployments de pull request não recebem `SIGAA_CONNECTOR_URL` nem
`SIGAA_CONNECTOR_API_SECRET`. O carregador server-only também rejeita o conector quando
`VERCEL_ENV=preview`, exceto no deployment de staging explicitamente identificado.

O banco de Preview é recriado com migrations e seed. Nenhum snapshot acadêmico de produção é
necessário para validar a interface.

## Staging

Staging usa credenciais próprias, diferentes de produção. O workflow remove conexões, snapshots,
tentativas, limites e matrículas originadas pelo SIGAA antes de publicar o deployment. A verificação
SQL falha se algum dado acadêmico importado permanecer. O deployment pode ser iniciado manualmente
na branch que contém o stack; os segredos entram somente nessa execução e não são cadastrados no
ambiente Preview geral do projeto.

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
