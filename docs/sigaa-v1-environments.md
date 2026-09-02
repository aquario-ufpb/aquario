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
