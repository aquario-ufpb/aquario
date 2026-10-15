# Planejador de matrícula e escolha de disciplinas

Proposta adicionada em 14/10/2026 à branch `feature/sigaa-sync-schedules`.
Status: implementado localmente, com as limitações de fonte descritas abaixo.
Complementa [o plano de sincronização e horários](sigaa-sync-schedules-plan.md).

## Implementação e operação

- Página `/planejador`, acessível em Recursos, no menu e pelo calendário pessoal.
- Consulta real ao SIGAA público: lista de cursos e formulário JSF de oferta por curso/semestre. A oferta é carregada automaticamente ao identificar/trocar o curso ou selecionar outro semestre; requisições anteriores são canceladas e suas respostas não são aplicadas ao semestre atual. Há cache público persistente de duas horas, indicação de carregamento e nova tentativa em caso de erro. Selecionar outro curso na consulta adicional também importa a oferta automaticamente.
  O adapter descobre os nomes dinâmicos do formulário, usa sessão anônima curta e não executa scripts da página.
- Fonte consultada para Engenharia da Computação (`1626865`) em 2026.2 retornou 71 turmas,
  com horário e `Vgs Reservadas`. O carimbo de consulta representa o instante observado; a oferta tem cache público de 2 horas.
- Reservas são registradas pelo ID do curso consultado. Consultar outro curso não transforma suas reservas
  em reservas do curso do aluno. A correspondência usa o curso importado pelo SIGAA (ou o perfil, sem importação) quando nome/campus identificam uma única opção. Casos ambíguos mantêm escolha manual.
- Cache em `PublicSigaaOfferingCache`, por curso/semestre, com validade de duas horas a partir da observação original. A rota de cache lê todos os cursos disponíveis em uma consulta ao banco, filtrando os códigos somente na resposta; não guarda o currículo ou preferências consultados. Só os cursos faltantes entram nas consultas ao SIGAA. “Atualizar ofertas” ignora esse cache; falha não grava oferta vazia e não renova a data. Migration `20261015000000_add_public_sigaa_offering_cache` necessária.
- Busca progressiva: dois trabalhadores consultam um curso por resposta, com cache público de duas horas e limite global de duas consultas simultâneas no servidor. O aluno pode calcular com os dados já carregados; resultados parciais permanecem visíveis quando chegam novas ofertas, com aviso para recalcular. Falhas individuais não interrompem os demais cursos.
- Plano de progresso avançado: equilibrado, abertura de cadeias ou disciplina alvo buscável. Analisa pré-requisitos diretos/indiretos com AND/OR, ciclos e regras desconhecidas; prioridades manuais continuam na frente e pré-requisitos não são satisfeitos por matrícula concorrente. Resultados mostram caminhos e o que terá pré-requisitos atendidos se houver aprovação. Não prevê oferta futura nem prazo de formatura.
- Motor determinístico em Web Worker, até três soluções, cancelamento, limite de 100 mil nós/1,5s,
  aviso quando interrompido pelo orçamento. Restrições não são relaxadas automaticamente.
- Modos simplificado (limites básicos) e avançado (filtros detalhados), ambos com grade completa de horários individuais e seções de manhã, tarde e noite, sem apagar escolhas na troca. A busca carrega ofertas para pendências/equivalentes em todos os cursos consultados, independentemente do filtro. Início com combinações limitadas à reserva publicada para o curso; atalho permite todas as alternativas sem confundir reserva com saldo ou garantia de matrícula. Clicar na aula permite fixar ou excluir aquela turma para o próximo cálculo. Cenários antigos recebem lista vazia de exclusões.
- Disponibilidade em grade semanal de segunda a sábado (2–7 no SIGAA) e todos os blocos M1–M6/T1–T6/N1–N4 na mesma visualização, verde/vermelho, clique/teclado e pintura por arraste no computador. Os cabeçalhos de dias se repetem em cada turno; clicar em um dia libera/bloqueia somente aquele dia no turno, sem alterar os demais. É possível ignorar impedimentos sem apagar as marcações.
- Prioridades em lista ordenável por arrastar, teclado ou botões. O motor compara a inclusão de cada cadeira na ordem escolhida, antes dos demais critérios; a busca visita essas prioridades primeiro. Disciplinas fora da lista entram se couberem.
- Meta inicial de 180h apenas na interface; limites informados no histórico substituem o padrão como valores iniciais. O cálculo respeita os limites escolhidos; diferenças da referência SIGAA aparecem como condições a conferir. Ajustes avançados e cenários salvos ficam recolhidos.
- O balão da aula mostra pré-requisitos e dependentes diretos, diferenciando pré-requisitos atendidos após aprovação daquela disciplina de cadeiras ainda condicionadas a outros requisitos. Seções vazias são omitidas; não significa oferta ou matrícula garantida.
- Alterar fixações/exclusões no resultado preserva a grade anterior com aviso e botão de recalcular; o popover também permite recalcular. Bloqueios de disciplinas exigidas e turmas fixadas mostram nomes/códigos e ações para remover a exigência ou desfixar.
- Turmas fixadas, alternativas equivalentes,
  filtros separados de oferta do curso, reservas/saldo e optativas, limites de carga/dias/janelas e transição entre locais.
- Uma única seção de motivos agrupa turmas descartadas e disciplinas viáveis fora da opção selecionada. Pré-requisitos mostram nomes conhecidos e códigos; nomes ausentes mantêm o código sem inventar dados.
- Pré-requisitos com expressões AND/OR e correquisitos; expressões não interpretadas ficam a verificar.
  O currículo importado é buscado por código e curso; não se agregam requisitos de todos os currículos.
  Dados locais sem confirmação do snapshot ficam condicionais, pois o catálogo atual não representa todas as regras.
- Cenários salvos em PostgreSQL por usuário, com versão otimista para evitar sobrescritas entre abas.
  Até 30 cenários por conta; salvar não escreve matrículas/concluídas e não persiste o snapshot SIGAA.
  Reabrir usa a oferta salva e recalcula com o histórico atual; a tela avisa para revalidar oferta/curso.
- Exportação somente da grade selecionada em PNG, com período, nomes/códigos, turma, horários e locais informados. A imagem indica simulação e condições pendentes; não contém histórico acadêmico. Controles de JSON, ICS e Google removidos da página a pedido do usuário.
- Turmas personalizadas e edição de localização/coordenadas pertencem ao cenário, sem alterar catálogo global.
  Distância em linha reta depende de coordenadas informadas; intervalo entre locais é uma restrição configurada pelo aluno.

### Instalação e verificação

Instalar dependências com `npm ci`, configurar o banco e aplicar `npx prisma migrate deploy`.
A migration adiciona `EnrollmentPlan`; as migrations foram aplicadas e conferidas em PostgreSQL descartável.
Sem essa tabela, é possível calcular, mas salvar/carregar cenários retorna erro explícito.

Verificações executadas: `npm run check-all`, `npm run verify:sigaa-boundary`, suíte Jest completa,
suíte Vitest em banco descartável e teste de persistência do planejador com
`PLANNER_TEST_DATABASE_URL` apontando para banco local descartável e migrado.
O teste de banco cobre isolamento de donos, atualizações obsoletas, cascata e ausência de escrita em matrículas.
As rotas foram exercitadas contra servidor local com autenticação e dois usuários de teste.
No Chromium, consulta real + cadastro de EDO + prioridade + solver funcionaram sem erros de página,
sem overflow horizontal em 1280/390 pixels. Nenhuma credencial real de aluno foi usada.
O download ICS e os links Google foram verificados na versão inicial; a interface atual exporta somente PNG.
`prisma migrate diff` confirmou ausência de divergência entre schema e banco migrado.
A suíte final Jest passou com 674 testes em 78 arquivos; Vitest passou com 158 testes de integração
no banco SIGAA descartável (os testes específicos do planejador em banco foram executados separadamente).
O build otimizado `next build` concluiu com sucesso. A migração foi aplicada somente em banco de teste local,
sem alteração do banco ou deployment de produção.

### Limitações verificadas

- A consulta pública usada fornece **reserva publicada**, mas não saldo disponível, demanda ou vagas totais.
  Esses campos são `null`, exibidos como “Não informado”; exigir saldo confirmado pode excluir todas as turmas.
- Essa consulta não fornece sala/local. É possível informar local/coordenadas no cenário para avaliar deslocamento.
  SACI continua fora do planejador e fica no fluxo de salas após matrícula.
- A consulta ao SIGAA pode falhar ou mudar de layout; nesse caso há erro explícito, sem preencher números fictícios.
- Integração Google OAuth/assinatura, inferência de vagas livres e rotas geográficas não fazem parte desta entrega.
- Solicitar matrícula continua sendo uma ação do aluno no SIGAA. Reservas e conferência de requisitos não garantem deferimento.

## Escopo confirmado pelo usuário

São dois fluxos com fontes e objetivos diferentes:

- **Já matriculado → calendário pessoal:** SIGAA informa o vínculo/turma; SACI confere/complementa a sala,
  pois o local mostrado no SIGAA pode estar desatualizado. Esse fluxo está no plano de horários.
- **Antes/durante a matrícula → planejador:** a oferta do **SIGAA** fornece turmas do semestre alvo,
  horários, reservas por curso e informações de vagas que a fonte disponibilizar. O planejador procura
  combinações conforme restrições e prioridades do aluno. **SACI não é fonte nem dependência desse planejador.**

“Reservas” foi confirmado como reserva de vagas para o curso do usuário.
Por padrão, favorecer turmas com essa reserva; permitir ampliar a busca para alternativas equivalentes
e turmas sem reserva. Equivalência acadêmica e reserva são atributos distintos: uma equivalente também pode ter reserva.

## Resultado esperado

O aluno informa quando pode estudar, escolhe prioridades entre as disciplinas que faltam e recebe
até três combinações de turmas, com horários, requisitos, vagas/reservas observadas e alternativas.
Cada combinação explica suas escolhas e as prioridades que não conseguiu atender.
O aluno pode fixar uma turma, trocar outra e recalcular sem perder suas preferências.

Planejamento e matrícula efetivada são estados distintos: simular ou salvar uma grade não marca
disciplinas como cursando e não envia solicitação ao SIGAA. Importar uma matrícula confirmada permanece
uma operação do fluxo acadêmico existente.

## Fluxo de uso

1. **Período a planejar.** Selecionar semestre e etapa: planejamento prévio, matrícula, rematrícula ou extraordinária.
   Sugerir um período pelas datas acadêmicas, mas exigir que o aluno veja/confirme qual oferta está sendo usada.
   O semestre ativo de aulas pode ser diferente daquele cuja matrícula está aberta.
2. **Disponibilidade semanal.** Marcar intervalos de segunda a sábado ou cadastrar blocos por formulário.
   Trabalho, compromissos e aulas já confirmadas funcionam como bloqueios; todos os encontros da turma precisam caber.
3. **Disciplinas candidatas.** Começar pelas pendentes do currículo correto; mostrar obrigatórias, optativas,
   pré-requisitos atendidos/pendentes e disciplinas que cada uma desbloqueia. Buscar a oferta no SIGAA,
   favorecendo turmas com reserva para o curso; oferecer equivalentes reconhecidas e outras turmas/centros conforme os filtros.
4. **Preferências.** Marcar “Preciso incluir”, “Prioridade alta”, “Se couber” ou “Não incluir”.
   Fixar uma turma específica é diferente de priorizar uma disciplina com várias turmas possíveis.
5. **Filtros e limites.** Definir quantidade/carga horária desejada, dias/turnos, intervalo entre aulas,
   limite de janelas e deslocamento. Reservas e vagas são filtros próprios, não uma única opção ambígua.
6. **Gerar e comparar.** Mostrar até três grades diferentes, com lista acessível e semana compacta, total de horas,
   prioridades atendidas, reservas para o curso, substituições por equivalentes, dias ocupados, janelas,
   deslocamentos entre aulas e pendências de verificação.
7. **Ajustar e salvar cenário.** Fixar/trocar turma ou disciplina e recalcular. Salvar alternativas A/B/C
   para usar caso uma turma não fique disponível. Atualizar a oferta não altera silenciosamente um cenário salvo.

## Disponibilidade, prioridades e personalizadas

- Intervalos disponíveis usam hora local `America/Recife`; o formulário é alternativa ao gesto de arrastar na grade.
- A agenda permite marcar **disponível**, **ocupado** ou **indisponível**. Ocupado e indisponível bloqueiam
  encontros; a distinção ajuda o aluno a editar seus compromissos. No modo “Usar somente horários marcados como disponíveis”,
  todo intervalo não marcado também fica fora da busca. No modo “Bloquear apenas meus impedimentos”, intervalos não marcados
  ficam livres. Um bloqueio sempre prevalece sobre uma disponibilidade sobreposta.
- Preferência de turno/horário é separada de indisponibilidade: o solver pode flexibilizar uma preferência conforme o modo
  escolhido, mas nunca desobedecer um intervalo bloqueado. A tela mostra qual modo de disponibilidade está ativo.
- Aula que termina exatamente quando outra começa não conflita por horário; deslocamento pode exigir intervalo adicional.
- O aluno pode pedir, por exemplo, 3–5 disciplinas ou uma faixa de carga horária. Limites institucionais conhecidos
  são apresentados separadamente da preferência pessoal; limite desconhecido fica “A verificar”.
- “Preciso incluir” é uma restrição explícita. Se duas disciplinas obrigatórias na simulação conflitam,
  explicar que não há combinação que atenda ambas; não remover uma delas silenciosamente.
- Uma disciplina personalizada pertence ao cenário do aluno e não altera o catálogo acadêmico global.
  Pode ter nome, código opcional, carga horária opcional e uma ou mais turmas com seus encontros/local.
- Personalizadas sem comprovação curricular recebem “Requisitos a verificar” e “Aproveitamento no curso a verificar”.
  Não contam automaticamente como créditos que faltam para integralizar o curso.
- O aluno pode informar vagas/reservas manualmente, mas esses números ficam marcados como informados pelo usuário,
  com data, sem substituir dados oficiais observados. Uma turma hipotética não vira oferta publicada.

## Vagas e reservas: dados e apresentação

“Somente com reserva” significa **reserva publicada para o curso do aluno**, não reservar uma vaga pelo Aquário.
Fixar uma turma na simulação tem outro rótulo: “Manter esta turma”.

| Campo | Apresentação | Regra |
| --- | --- | --- |
| Vagas ofertadas | `40 ofertadas` | Valor da turma; não usar capacidade da sala |
| Matrículas confirmadas | `28 matriculados` | Somente se a fonte fornecer esse significado |
| Solicitações | `52 solicitações` | Não equivalem a matrículas confirmadas nem a uma fila pessoal |
| Reserva para o curso | `10 reservadas para Engenharia da Computação` | Associar por ID do curso e período, não por nome aproximado |
| Saldo disponível | `3 vagas disponíveis` | Apenas se a fonte fornecer saldo aplicável à etapa/ao aluno |
| Dado ausente | `Não informado` | `null` é diferente de zero |
| Atualidade | `Consultado às …` | Vincular a fonte, semestre e versão da consulta |

Filtros separados: “Todas as turmas”, “Com reserva para meu curso” e “Com vagas disponíveis confirmadas”.
O filtro estrito de reservas exclui as de reserva desconhecida, mas informa quantas ficaram de fora por falta de dado.
Uma turma sem reserva específica pode ainda ser disputável; aparecer como sem reserva não significa matrícula proibida.
Permitir incluir essas turmas na comparação, conforme a opção do aluno.

Comportamento padrão: **“Priorizar reservas para meu curso”**. Primeiro tentar atender as prioridades
com essas ofertas; quando alternativas sem reserva ou equivalentes melhorarem a viabilidade,
apresentar a diferença explicitamente: “Esta opção inclui EDO sem reserva para atender sua prioridade”.
O usuário controla “Permitir turmas sem reserva” e “Permitir equivalentes”. No modo estrito
“Somente com reserva para meu curso”, nenhuma dessas opções pode contornar o filtro de reserva.
Uma prioridade alta de disciplina não deve ser descartada silenciosamente só para aumentar a contagem de reservas.

Equivalentes devem vir de relação reconhecida e aplicável ao currículo do aluno. Não associar por
nome parecido, não assumir simetria/transitividade e não contar a disciplina original e sua substituta
duas vezes para o mesmo objetivo curricular. Mostrar “X atende à pendência Y” e a origem dessa relação.

Não calcular “vagas disponíveis = ofertadas − solicitações”, nem tratar reserva total como saldo reservado.
Na matrícula regular, demanda e regras de processamento podem impedir a confirmação mesmo com reserva.
Na extraordinária, revalidar o saldo antes de o aluno seguir para a matrícula; uma consulta anterior não garante a vaga.
Não apresentar porcentagem de chance de aprovação sem modelo e dados validados.

## Verificação acadêmica explicável

Cada candidata terá estado `atendido`, `não atendido` ou `a verificar`, com lista de razões e fonte.
Usar o currículo explicitamente associado ao aluno, não a união de regras de todos os currículos da disciplina.

- Pré-requisitos: componentes aprovados e equivalências oficialmente reconhecidas; distinguir regras AND/OR.
  Se o catálogo não representa uma expressão ou ela não puder ser interpretada, preservar a expressão e marcar “A verificar”.
- Correquisitos: verificar se já cumpridos ou incluídos no mesmo cenário, quando a regra permitir.
- Disciplinas cursando: não tratar como aprovadas. No planejamento do próximo semestre, permitir
  “Simular aprovação das disciplinas atuais”, desligado por padrão; cada resultado dependente recebe essa condição.
- Regras adicionais: carga mínima/máxima, carga cumprida, restrição de curso/turno/campus, autorização e quebra de requisito.
  Quando não houver fonte suficiente, não converter ausência de dado em autorização.
- Oferta em outro centro não é excluída só por estar fora do catálogo local. Verificar elegibilidade e deslocamento
  separadamente; aproveitar o caso real de matrícula extraordinária como teste de produto.
- Modalidade, estágio, TCC e atividades sem horário fixo precisam de tratamento explícito, com carga e restrições próprias.
  Horário desconhecido não deve ser considerado livre pelo otimizador; manter como item a verificar até confirmação.

O resultado é uma conferência dos dados disponíveis. O processamento oficial do SIGAA continua decidindo a matrícula.

## Otimização e explicações

Implementar um solver determinístico de restrições, sem depender de modelo de linguagem para decidir viabilidade.
Cada variável representa uma turma; opções da mesma disciplina são mutuamente exclusivas.
Os encontros de uma turma são indivisíveis e incluem todos os dias e locais.

Restrições obrigatórias: semestre compatível, disponibilidade, ausência de sobreposição, turmas fixadas,
disciplinas exigidas pelo aluno, limites estritos configurados e requisitos comprovados.
Por padrão, turmas com requisito/horário a verificar ficam fora das grades verificadas.
Uma opção explícita permite comparações condicionais, identificadas como tal.

Ordenar soluções primeiro pelo atendimento das prioridades de disciplinas e, entre soluções que
as atendam de modo equivalente, favorecer reservas para o curso. Depois considerar progresso curricular
(obrigatórias e cadeias de pré-requisitos), dias/janelas/deslocamentos e preferências restantes.
Reservas desconhecidas não pontuam como reservas confirmadas. Demanda pode ser um critério adicional
somente com dados válidos; não equivale a maximizar chance de matrícula.
Permitir modos “Priorizar disciplinas”, “Concentrar em menos dias” e “Reduzir janelas”, com critérios visíveis.

Para o MVP, começar com busca limitada e poda, ordenando primeiro candidatas com poucas opções.
Definir limites de candidatas, tempo e soluções; medir desempenho com fixtures realistas.
Se o limite for atingido, informar “Melhores opções encontradas neste cálculo”; não prometer ótimo global.
Desempate determinístico e diversidade por conjuntos de turmas; não mostrar três cópias equivalentes.
O aluno pode cancelar o cálculo. Executar fora da renderização principal, em Web Worker quando os dados já estiverem no cliente.

Se não houver solução completa, explicar o conflito concreto e oferecer relaxamentos, por exemplo:
“EDO e Física só têm turmas no mesmo horário”; “4 disciplinas excedem sua disponibilidade”; “Falta Cálculo II”.
Não relaxar filtros de reserva, horários ou disciplinas exigidas sem ação do aluno.

## Indicador de distância e deslocamento

No planejador, usar o local informado na **oferta SIGAA** quando disponível, com a observação de que
a sala pode mudar até o início das aulas. SACI permanece no fluxo de calendário após matrícula.

- Mostrar por turma campus/prédio e, na comparação de grades, o par de aulas que exige maior deslocamento.
  Uma turma só é “mais distante” em relação a uma referência explícita: aula anterior/seguinte ou ponto inicial escolhido.
- Se houver coordenadas confiáveis, exibir distância aproximada entre prédios. Sem rota ou modelo validado,
  não transformar distância em minutos exatos nem em trajeto acessível garantido.
- Permitir que o aluno configure intervalo mínimo entre locais ou tempo estimado de deslocamento.
  Com intervalo mínimo obrigatório, uma transição inviável impede a combinação mesmo sem sobreposição de aulas.
- Preferência “Evitar outros campi/prédios distantes” pode penalizar uma solução sem proibi-la;
  bloqueio de campus e limite de deslocamento são opções estritas separadas.
- Se faltar localização, mostrar “Deslocamento a verificar”. Ausência de coordenadas não vale como distância zero.
  Com verificação estrita de deslocamento ativa, cenários dependentes de local desconhecido são condicionais.
- Se a sala mudar depois da matrícula, o calendário pessoal consulta a alocação SACI correspondente e
  sinaliza a mudança; isso não reescreve a oferta usada em um cenário de planejamento salvo.

## Fontes existentes e lacunas verificadas no código

| Fonte | Reutilizar | Falta validar/implementar |
| --- | --- | --- |
| Snapshot privado SIGAA | Concluídas/pendentes/cursando, currículo, carga horária e expressões de requisitos | Regras não estruturadas e atualização do histórico antes de planejar |
| Grade curricular local | Catálogo por currículo, natureza, pré-requisitos, equivalências | Versão vigente e semântica de equivalências e expressões |
| Oferta de turmas SIGAA | Fonte do planejador: turmas/horários do período alvo, vagas e reservas para o curso quando disponibilizadas | Validar extração, campos, paginação, reserva por curso e atualização; a página pública não prova disponibilidade de todos os detalhes |
| Calendário acadêmico | Datas de matrícula/rematrícula/extraordinária | Usar o período alvo correto e sinalizar datas ausentes/atualizadas |
| Entrada personalizada | Oferta externa ou ausente | Proveniência manual, requisitos e vagas desconhecidos |

`PrismaDisciplinaRepository.getRelacoes()` agrega pré-requisitos de todos os currículos.
Esse endpoint serve à visualização atual, mas **não deve fundamentar a elegibilidade do planejador**.
Criar serviço de requisitos com `curriculoId` e representação de expressão, preservando informações não interpretadas.
O modelo `Vaga` do projeto representa oportunidades de emprego e não vagas acadêmicas.

Criar uma porta de ofertas acadêmicas normalizadas com `source`, `observedAt`, `semester`, identidade
da turma, encontros, local e campos opcionais de vagas/reservas/demanda. O adapter consulta SIGAA;
o solver recebe dados normalizados e não depende do formato HTML. SACI/PAAS não integra essa porta do planejador.
Manter consultas públicas de oferta separadas da sincronização de credenciais efêmeras do aluno.
Dados públicos podem ter cache compartilhado por período/unidade; histórico, preferências e cenários são privados.

Persistência proposta: `EnrollmentPlan` por usuário/período, cenários e preferências versionados,
com referência à revisão da oferta. Personalizadas e soluções são partes privadas do plano.
Salvar o plano não escreve `DisciplinaSemestre` nem `DisciplinaConcluida`.
Mudanças de currículo/curso ou exclusão dos dados SIGAA exigem revalidar cenários e remover dados derivados privados pertinentes.

## Entregas propostas

1. **Prova de dados:** fixtures de oferta SIGAA com vagas/reservas e dois cursos; identificar o que é publicado antes da matrícula.
2. **Motor de regras:** disponibilidade, requisitos por currículo, conflitos, correquisitos e estados desconhecidos; testes sem rede.
3. **Simulador:** prioridades, reservas favorecidas, equivalentes, fixação de turmas, até três alternativas e motivos para exclusões; personalizadas.
4. **Vagas/reservas:** integrar somente após a prova de dados; contagens, filtros, carimbo de consulta e revalidação.
5. **Cenários e calendário:** salvar alternativas privadas e exportar cenário escolhido; grade planejada separada de matrícula confirmada.

Critérios de aceite essenciais: nenhuma sobreposição, nenhum requisito desconhecido marcado como atendido,
reserva de outro curso não satisfaz o filtro, período errado não entra, dado ausente não vira zero,
personalizada não altera catálogo e cenário não altera matrícula. Testar também entrada impossível,
turma externa, atualização de oferta, cenário condicionado à aprovação, múltiplos blocos e limite do solver.
Incluir testes para reserva de outro curso, modo estrito versus preferência por reserva, substituta equivalente sem
dupla contagem, disponibilidade não marcada, bloqueio sobreposto e transição entre prédios com intervalo insuficiente.

## A definir antes da integração completa

- Como extrair da oferta SIGAA a reserva por curso, saldo e solicitações em cada etapa? Ainda não foi comprovado um contrato de API para esses campos; não condicionar a integração à existência de uma API JSON.
- Quais centros e períodos têm oferta publicada antes da matrícula? Sem oferta publicada, permitir rascunho hipotético identificado.
- Quais regras institucionais adicionais são consultáveis e versionáveis para o currículo do aluno?
- Qual prazo de validade e frequência de atualização é adequado para cada fonte, sobretudo na extraordinária?
- Qual limite de candidatas/tempo mantém o cálculo rápido em celulares? Escolher por medição, não por suposição.
- Qual referência de localização o aluno quer usar para a primeira/última aula e quais prédios têm coordenadas confiáveis?

## Referências consultadas

- [STI/UFPB — processamento de matrículas](https://conhecimento.sti.ufpb.br/books/processamento-de-matriculas/page/introducao): capacidade, reservas por curso e processamento por prioridades; não equivale a saldo garantido para cada aluno.
- [SIGAA/UFPB — consulta pública de turmas](https://sigaa.ufpb.br/sigaa/public/turmas/listar.jsf?aba=p-ensino): consulta por nível, unidade e ano/período; detalhes de vagas/reservas ainda precisam de prova de dados.

## Cadastro local

`npm run db:seed:registration` cadastra por upsert o Campus I, os centros CI/Outro e os cinco cursos do seed principal. Pode ser repetido e preserva usuários e conteúdo existente. Requer `.env`, PostgreSQL local e migrations aplicadas.

Os turnos aparecem agrupados em células M/T/N, separados visualmente, com dois botões por ícone para liberar/bloquear o turno inteiro e restauração global. O curso tem busca por nome/campus; horários e prioridades ficam lado a lado no desktop e empilhados no celular.

A grade usa os mesmos horários de `TIME_SLOTS_BY_PERIOD` do calendário; a noite possui quatro blocos de 50 minutos (19:00–22:20), conferidos na [legenda oficial da UFPB](https://ufpb.br/dq/contents/documentos/horario-de-aulas-resolucao-20-2020-consepe.pdf).

## Busca ampliada e limites da simulação

O planejador busca as ofertas públicas de todos os cursos para os códigos e equivalentes presentes no currículo do aluno (incluindo disciplinas atuais, que saem do cálculo ao simular aprovação). Uma consulta ao banco recupera de uma vez os cursos com cache público válido por duas horas; apenas cursos faltantes entram na fila. A API aceita lotes de até quatro cursos, e a interface recebe cada curso assim que termina, com dois trabalhadores e compartilhamento de consultas em andamento. A interface permite calcular antes de terminar, com aviso de cobertura parcial, preserva os resultados e oferece recalcular quando chegam novos dados. “Atualizar ofertas” força uma consulta à fonte sem renovar artificialmente a data do cache. Ausência nessas fontes não comprova ausência de uma turma no SIGAA.

A busca real de 2026.2 consultou 127 cursos sem falhas e encontrou Língua Inglesa I em ofertas de outros cursos, além das 71 turmas da oferta de Engenharia da Computação. Reservas são mantidas por curso de origem; nenhuma reserva de outro curso é atribuída ao aluno. O filtro de oferta do curso exige presença nessa oferta, mesmo com reserva zero; o filtro de reserva exige quantidade positiva para o curso selecionado.

Obrigatoriedade vem do currículo SIGAA ou do catálogo correspondente. Optativas podem ser desativadas. Sem prioridade ou fixação explícita, uma optativa não é incluída quando sua remoção preserva os mínimos, correquisitos e demais restrições; pode completar uma carga mínima que as obrigatórias não preencham.

O mínimo institucional do snapshot preenche inicialmente o campo de carga, mas deixa de ser um limite oculto quando o usuário muda esse valor. Cenários abaixo/acima dos limites do currículo têm indicação de validação pendente no SIGAA; não alteram nem garantem matrícula. A duração de uma aula, as janelas entre aulas e a carga semestral são grandezas distintas.

## Revisão de usabilidade

Oferta, escopo e atualização ficam no mesmo cartão. Detalhes de cobertura e dados consultados ficam recolhidos, enquanto falhas, carregamento e alertas continuam visíveis. A navegação por seção leva aos horários, prioridades, limites e resultados. No desktop, horários ficam ao lado das prioridades e limites; no celular, seguem uma sequência única sem rolagem horizontal da página.

A comparação usa três cartões compactos, com carga, disciplinas, dias e janelas; ressalvas aparecem apenas quando existem. A grade selecionada vem antes da explicação dos caminhos acadêmicos, com fixação e imagem no cabeçalho. Deslocamentos informados permanecem visíveis junto à grade. A barra fixa de cálculo respeita a área segura do dispositivo, mantém cancelamento acessível e não impede calcular durante a busca parcial. A navegação automática aos resultados respeita a preferência por movimento reduzido.

Busca de prioridades pode ser limpa por um botão; metadados com zero dependências não ocupam espaço. Limites mínimos maiores que os máximos geram um aviso imediato. Fixar uma turma, inclusive uma grade inteira, retira a mesma turma das exclusões para evitar escolhas contraditórias. A paleta do planejador e do PNG preserva contraste de pelo menos 4,5:1 para texto branco.

Na página de grades curriculares, o mapa de dependências é a visualização inicial; a coluna 0 reúne as disciplinas sem período, com “Ver mais” quando há muitas. A seleção inicial aguarda autenticação e perfil para usar o curso do aluno, preservando eventual escolha manual.
