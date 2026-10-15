# Plano: status acadêmico, turmas, salas e horários pelo SIGAA

Análise em 14/10/2026. O plano abaixo cobre a evolução completa; a primeira entrega de calendário e matrícula extraordinária já foi implementada localmente.

## Primeira entrega implementada

- A grade curricular usa a mesma combinação de status de Dados acadêmicos (SIGAA prevalece sobre manual), associando códigos aos IDs da grade apenas no curso do aluno. Divergência de currículo e disciplinas importadas ausentes ficam explícitas, sem copiar o histórico para tabelas manuais.
- Turmas da última importação SIGAA entram na lista e no calendário por projeção de leitura, sem criar matrículas manuais; somente do semestre correspondente. Códigos já importados não se repetem na lista manual. Horários ausentes/inválidos e salas sem conferência ficam como pendências.
- Calendário pessoal em largura total, sem a antiga coluna lateral comprimindo a semana.
- Semana com largura fixa ao espaço disponível, cabeçalhos fixos e linhas sem aulas ocultas; opção de mostrar o dia inteiro.
- Alternância Semana/Lista no desktop e lista de aulas no celular; sábado aparece quando há aula.
- Busca de ofertas sem caixa de rolagem interna: carregamento visual em grupos de 12; busca de disciplinas pessoais limitada a 8 resultados com orientação para refinar.
- Pendências visíveis por disciplina, com resumo “A definir ou conferir”; distingue falta de oferta, falta de turma e horário não reconhecido.
- Recuperação de ID PAAS antigo apenas quando código e número da turma salva têm um candidato único na oferta do mesmo semestre.
- Horários manuais/salvos podem aparecer sem correspondência no SACI, com sala a confirmar.
- Cadastro de turma/horário/docente para matrícula extraordinária, usando a API de matrícula existente. Uma turma manual não é associada automaticamente à oferta local pelo mesmo número.
- Parser suporta blocos separados por espaço/vírgula/ponto e vírgula e deduplica horários; rejeita entradas parcialmente desconhecidas.
- Consulta externa SACI cancela a requisição no timeout e verifica centro/publicação; fallback local não usa dados do CI para outro centro.

Séries e EDO (`1103180`) consta na oferta CI 2026.2 com turmas 07/CI 106 e 01/LIEPE 04.
Matrículas extraordinárias em outra oferta/local não podem ser associadas a essas turmas sem conferir código, número e semestre.
A integração atual consulta apenas o centro escolhido pelo perfil; isso é uma hipótese para a ausência, não diagnóstico da matrícula real.

## A definir e próximos trabalhos

O [planejador de matrícula e escolha de disciplinas](enrollment-planner-plan.md) detalha a implementação
de disponibilidade semanal, prioridades, otimização de grades, requisitos, disciplinas personalizadas e vagas/reservas.
Está disponível em `/planejador`, separado da matrícula já confirmada e da primeira entrega do calendário.
No planejador, a oferta vem do SIGAA. SACI fica no fluxo após a matrícula, para conferir a sala da turma,
inclusive quando o local informado no SIGAA estiver desatualizado.

1. Exigir número, centro e horário da turma extraordinária para confirmar correspondência; sem isso, não atribuir sala CI à turma externa.
2. Definir como persistir sala manual e preferências por encontro; a primeira entrega mantém “Sala a confirmar”.
3. Validar quais outros centros possuem oferta pública no SACI e permitir busca entre centros com vínculo explícito de semestre/turma.
4. A projeção de turmas SIGAA no calendário já está implementada. Falta concluir associação automática segura com salas SACI e o resumo das mudanças entre sincronizações; o contrato atual importa um ID interno de turma, não seu número. SACI só complementa uma associação manual já salva quando código, semestre e horário concordam.
5. Revisar fuso e limites da recorrência nos exportadores existentes antes de considerar a etapa de calendário concluída.
6. Decidir entre assinatura privada e OAuth para atualização automática externa. ICS e links continuam sendo exportações pontuais.
7. Confirmar repositório, licença e condições de uso do SACI/UFPB. A API pública responde e já é usada pelo Aquário, mas a pesquisa não confirmou que seu código seja open source. O SACI de comunicação da UFPR é outro projeto.

## Base e instruções consultadas

- Fork: `https://github.com/tahaluh/aquario`, remoto `origin`.
- Original: `https://github.com/aquario-ufpb/aquario`, remoto `upstream`.
- O fork estava em `848e627`, 372 commits atrás de `upstream/main`, sem commits exclusivos.
- A `main` local foi atualizada por fast-forward até `923b411df89cacec029db32dde8a3fd0a68aad1a`.
- Branch de trabalho: `feature/sigaa-sync-schedules`, criada sobre essa base.
- Não há branches remotas `dev` ou `prod`. `main` alimenta staging; produção publica a tag de uma GitHub Release. `release/1.12.x` recebe manutenção da série lançada. Para esta feature, usar `main`.
- Lidos `CONTRIBUTING.md`, `README-DEV.md`, `.claude/CLAUDE.md`, `.cursor/rules.md` e `docs/sigaa-v1-environments.md`. Não foram encontrados arquivos de regras do Cline nem `AGENTS.md` geral do projeto; os `AGENTS.md` encontrados pertencem a skills específicas em `.agents/skills`.
- Manter repositories pelo container, validação Zod, React Query e `apiClient`, separação server/client/shared, nomes de arquivos em kebab-case e texto de interface em português.
- Atualização, implementação e branch são locais; não houve push, migração nem deploy.

## O que já existe

| Área | Implementação atual | Consequência para a feature |
| --- | --- | --- |
| Sync privado SIGAA | `src/app/api/usuarios/me/sigaa/` e `src/lib/server/services/sigaa/` | Reutilizar conexão, consentimento, reautenticação, leases e idempotência |
| Status das disciplinas | Snapshot com `completed`, `enrolled`, `pending`, `unknown`; `combine-academic-display.ts` | Estender a projeção existente para grade/calendário; não recriar a sincronização |
| Preservação manual | SIGAA tem precedência de apresentação; seleção manual fica separada | Manter a reversibilidade ao excluir dados importados |
| Onboarding | `project-onboarding-suggestions.ts` sugere concluídas/cursando e apresenta conflitos | Reaproveitar identificação por código e validação de semestre |
| Turmas SIGAA | Contrato V1 recebe `sourceKey`, `name`, `code`, `room`, `scheduleRaw`, `semester` | Já há material para horários; não há campo explícito para número da turma ou docente |
| Página acadêmica | `/me/academico` mostra turmas, sala e horário textual | Incluir acesso ao calendário e a mesma apresentação normalizada |
| Calendário | `minhas-disciplinas.tsx` resolve `codigoPaas` para `ClassWithRoom` | Hoje não renderiza uma turma apenas com dados SIGAA; depende da oferta PAAS do semestre |
| SACI/PAAS | `paas.ts`, providers externo/local e atualização semanal | Já existe integração de salas/turmas; estendê-la |
| Exportação | `ics.ts`, `google-calendar.ts`, ações em `calendar-grid.tsx` | Recorrência semanal já existe; adaptar e corrigir casos de datas/fuso |
| Matrícula manual | `DisciplinaSemestre`: turma/docente/horario/codigoPaas | Não guarda sala nem encontros normalizados; evitar usar essa tabela como cópia destrutiva do SIGAA |

## SACI confirmado e limites dos dados

Consulta pública feita com sucesso a `https://sa.ci.ufpb.br/api/paas/center?id=CI`.
Resposta publicada: período **2026.2**, **25 salas**, **163 entradas de turma**, solução de **07/10/2026**.
O backup `content/aquario-paas/saci.json` tinha os mesmos totais e período.
Há **29 códigos de disciplina com mais de uma entrada**: código sozinho não identifica turma.
A data do centro era antiga, diferente da data da solução; usar período, status e data da solução para avaliar atualidade.
Os resultados são uma fotografia da consulta, não garantia de disponibilidade ou completude futura.

O conector oficial foi inspecionado no commit `d0bbc7a55457807c0944ad86246350cc5e768986`:
`source_key` é mapeado de `item.id_turma`. **Não é comprovadamente o número da turma, nem o ID PAAS.**
Não associar esses IDs sem uma correspondência documentada. O conector fixa `sigaa-tools` em
`bd9e4efd60becb706d9cc455c784bce49b027435`.

## Comportamento proposto

1. O aluno usa a sincronização SIGAA existente. Quando concluída, a interface atualiza status e horários a partir do novo snapshot.
2. A página `/calendario` oferece uma tabela e a grade semanal, ambas derivadas da mesma projeção.
3. A tabela mostra disciplina/código, status, turma, dias e intervalos, sala/prédio, origem e data de atualização; permite adicionar ao calendário por turma e exportar todas.
4. Horário SIGAA válido aparece mesmo sem oferta PAAS, sala definida ou disciplina no catálogo local.
5. Dados incompletos continuam visíveis com “Turma não identificada”, “Sala a confirmar” ou “Horário não informado”. Somente entradas com horário e vigência válidos podem ser exportadas.
6. SACI complementa turma/docente/sala com correspondência suficientemente precisa. Ambiguidades abrem seleção manual de candidatos; nunca escolher o primeiro resultado.
7. Alteração posterior no SIGAA recalcula os dados importados. Dados manuais e preferências explícitas permanecem identificáveis e preservados.
8. O usuário pode consultar o último snapshot após desconectar, com a data visível, conforme a semântica atual. Excluir os dados SIGAA remove sua projeção e mantém a seleção manual.

## Fontes e regras de associação

- **Status acadêmico:** manter a precedência atual do SIGAA; não transformar `unknown` em pendente nem inferir aprovação pela ausência em turmas. Os quatro estados atuais bastam ao MVP; reprovação/trancamento detalhados exigem outra decisão de domínio.
- **Matrícula e semestre:** usar semestre explícito da turma. Se ausente, considerar semestre da identidade somente quando sua semântica for confirmada no adapter; sem isso, deixar a associação pendente. Dados de outro período não entram na grade ativa.
- **Horário:** preferir SIGAA quando interpretável. Complementar via PAAS apenas com semestre compatível e turma identificada; exibir divergências, sem trocar silenciosamente o horário.
- **Sala após matrícula:** consultar SACI para conferir/complementar a alocação da turma exata no mesmo semestre,
  pois a sala SIGAA pode estar desatualizada. Quando a solução SACI publicada estiver validada como vigente e a associação
  for inequívoca, usá-la como sala apresentada, preservando a informação original e a divergência nos detalhes.
  Sem confirmação de correspondência/vigência, mostrar “Sala a conferir”; a última consulta sozinha não comprova atualidade.
- **Correspondência:** código normalizado + período + número de turma explícito quando disponível. Sem número, comparar conjuntos completos de encontros e salas disponíveis; aceitar somente candidato único e não contraditório. Nomes servem para ajudar a revisão, sem associação automática aproximada.
- Preservar zeros no número de turma e regras de normalização comprovadas por fixtures. Não equiparar turmas diferentes por conversão numérica indiscriminada.
- Não eliminar entradas legítimas de uma turma que tenham encontros em salas distintas. Associar local por encontro e manter a identidade da turma acima deles.
- PAAS de outro semestre ou com validade indeterminada permanece consultável como oferta separada, sem enriquecer a grade pessoal ativa.

## Arquitetura proposta

Começar com **projeção de leitura**, sem copiar o snapshot SIGAA para tabelas manuais.
O snapshot validado continua sendo a fonte persistida; os encontros são derivados por funções puras em `lib/shared`.

Criar um modelo de apresentação de turma independente de `PaasClass`/`ClassWithRoom`, com:

- Identidade estável: origem + semestre + chave da turma; código e nome da disciplina, ID local opcional e número de turma opcional.
- Estado acadêmico, origem por campo, instante da observação e resultado da associação (`exact`, `ambiguous`, `unmatched`, `semester_mismatch`).
- Encontros: dia ISO da semana, início/fim `HH:mm`, fuso `America/Recife`, sala/prédio opcionais e vigência.
- Texto bruto e erros de interpretação, para apresentar dados sem inventar horários.

O hook composto reúne `useOwnSigaaAcademicState`, semestre, seleções manuais e `usePaasCalendar`.
Um adapter transforma PAAS e outro transforma SIGAA no modelo comum. Grade, tabela, conflitos e exportadores consomem esse modelo.
IDs do PAAS não devem virar requisito para renderizar ou exportar. A sincronização deve invalidar a query SIGAA, usada também pelo hook composto.

Não é necessária migration para a primeira entrega de leitura. Para salvar escolhas de candidatos/salas,
propor uma tabela própria de overrides por usuário/semestre/chave SIGAA, com vínculo ao candidato e versão da solução PAAS.
Preferências são revalidadas quando a oferta muda; não reaproveitar IDs PAAS de outro semestre.
Essa segunda entrega deve incluir repository, ownership, exclusão junto dos dados importados e atualização da limpeza de staging.

## Parser e calendário recorrente

O parser atual aceita somente um bloco `dias + M/T/N + posições` e retorna vazio em outros formatos.
Ele também aceita dias numéricos sem validação completa, e a grade exibe apenas segunda a sexta.
Antes de ampliá-lo, obter fixtures anonimizadas do formato efetivo de `schedule_raw` no adapter fixado.
O exemplo de contrato `246M12` é fixture sintética, não comprova todos os formatos usados no SIGAA.

- Aceitar múltiplos blocos, separadores comprovados, sábado e intervalos em turnos diferentes; rejeitar tokens desconhecidos com diagnóstico explícito.
- Confirmar a tabela de períodos da UFPB. Reutilizar a tabela atual apenas depois dessa conferência; não supor que toda aula tem 60 minutos.
- Deduplicar posições e agrupar apenas intervalos realmente contíguos, no mesmo dia e local. A adjacência de índices não basta quando há intervalo ou mudança de sala.
- Conflitos usam interseção de intervalos; término igual ao início seguinte não é conflito.
- A vigência vem de `SemestreLetivo`, limitada por datas específicas da turma quando disponíveis. Ausência de datas válidas impede exportar uma série aberta sem término.
- Usar fuso `America/Recife` em todo o fluxo. O resultado deve ser igual em navegador configurado em Recife, UTC ou outro país.
- Criar série semanal por conjunto de encontros compatíveis, com `RRULE`, `BYDAY` e limite final consistente com o tipo de `DTSTART`. Não emitir ocorrência antes do início nem após o fim.
- Corrigir o cálculo da primeira ocorrência: escolher o primeiro dia cronológico válido, não apenas o menor número do dia da semana.
- Revisar ICS atual: os horários são montados com datas do navegador e sem definição explícita de fuso; definir serialização UTC ou TZID consistente e testá-la.
- Revisar Google atual: horários locais sem fuso explícito e agrupamento por horário apenas. Incluir fuso e separar locais diferentes; validar a URL de template no navegador, pois a documentação da API não garante parâmetros desse endpoint.
- ICS deve ter UID estável por turma/série e revisão coerente. Reimportar um arquivo ou abrir links novamente pode duplicar eventos dependendo do aplicativo; não prometer atualização automática.
- Feriados/recessos: excluir apenas eventos acadêmicos explicitamente marcados como sem aula e de escopo aplicável. Não converter toda categoria acadêmica em cancelamento. Adiar exceções sofisticadas até haver essa classificação.

O MVP entrega **arquivo ICS e links para adicionar séries no Google Agenda**. A atualização automática
de uma agenda externa é outra etapa: feed privado por assinatura com token revogável e rotação,
ou integração OAuth com IDs persistidos e reconciliação de alterações/cancelamentos. Definir uma dessas opções antes de prometer sync contínuo.

## Entregas e critérios de aceite

| Etapa | Trabalho | Aceite |
| --- | --- | --- |
| 1 — Contratos e fixtures | Verificar extração real, semestre, slots e identidade; definir modelo comum e parser | Formatos conhecidos interpretados integralmente; desconhecidos permanecem visíveis com diagnóstico |
| 2 — Projeção de status/horário | Integrar snapshot ao calendário, inclusive sem catálogo/PAAS | Sync altera apresentação; exclusão restaura seleção manual; nenhum dado manual sobrescrito |
| 3 — Salas e turmas SACI | Associação determinística, metadados de atualidade e revisão de candidatos | Semestre divergente e 2+ candidatos não são associados automaticamente |
| 4 — Tabela e grade | Tabela responsiva, sábado quando necessário, detalhes, origem, conflitos e links para mapa quando houver sala reconhecida | As duas visualizações mostram os mesmos encontros; sala desconhecida não impede ver horário |
| 5 — Calendários | Adaptar ICS/Google ao modelo, vigência, UID, fuso e locais por encontro | Horários e repetição conferidos em Google e em um leitor ICS; nenhuma ocorrência fora do período |
| 6 — Persistência opcional | Salvar resoluções/overrides com migration e repository, se incluídos na entrega | Escolha sobrevive ao reload e é revalidada após nova oferta; exclusão e isolamento por usuário comprovados |

Executar etapas 1–2 antes de depender de mudanças no conector. Se for preciso número da turma,
docente ou vigência extraídos de novas páginas, fazer alteração coordenada no repositório do conector.
Os schemas atuais são `.strict()` e fixam versão `1.0`: novos campos exigem evolução versionada
compatível, fixture, testes nos dois lados e ordem de deploy definida; não inserir campos extras apenas no Python.

## Verificação prevista para a implementação

- Unitários do parser: múltiplos blocos, sábado, noturno, intervalos, duplicatas e entrada parcialmente inválida.
- Unitários da associação: duas turmas de mesmo código, semestre diferente, turma sem código, PAAS sem publicação e mesma turma em várias salas.
- Integração de interface: snapshot após sync, sem PAAS, conflito manual, snapshot antigo, erro de atualização, desconexão/exclusão e falta de datas.
- Exportação: semestre começa no meio da semana, última aula no dia final, fuso do navegador diferente e UID estável. Testar exclusões quando suportadas.
- Se houver persistência: ownership, concorrência, migration e remoção dos overrides na exclusão/limpeza de staging.
- Comandos: `npm run check-all`, `npm test -- --runInBand`, `npm run test:integration -- --run`, `npm run verify:sigaa-boundary`; `npm run test:sigaa-db` se alterar persistência SIGAA.
- Smoke local/staging com fixtures primeiro. Conferência real de SIGAA depende de sessão consentida do aluno; credenciais efêmeras e sem retry automático permanecem como hoje.

## Fontes e rastreabilidade

- [Aquário na revisão analisada](https://github.com/aquario-ufpb/aquario/tree/923b411df89cacec029db32dde8a3fd0a68aad1a).
- [Conector na revisão analisada](https://github.com/aquario-ufpb/aquario-sigaa-connector/tree/d0bbc7a55457807c0944ad86246350cc5e768986).
- [API pública SACI/PAAS consultada](https://sa.ci.ufpb.br/api/paas/center?id=CI).
- [Documentação Google: recorrência, exceções e fusos](https://developers.google.com/workspace/calendar/api/concepts/events-calendars).
- [RFC 5545: iCalendar](https://www.rfc-editor.org/rfc/rfc5545), referência normativa a conferir durante a implementação dos exportadores.

Análise validada por inspeção dos arquivos e consulta pública do SACI. A primeira entrega possui 15 casos de teste
de parser, resolução de ofertas e formulário manual, incluindo matrícula extraordinária, ambiguidade, IDs substituídos e semestre divergente.
Jest focalizado, `npm run check-all` (TypeScript, ESLint, Prettier) e verificação da fronteira SIGAA passaram.
A navegação pública com APIs simuladas foi conferida em Chromium: largura do documento igual à tela em 1280 e 390 pixels,
alternância entre semana/lista e redução de 16 para 2 linhas no exemplo de EDO; sem erros de página nessa navegação.
O fluxo de matrícula extraordinária também foi conferido no navegador com usuário e API simulados:
salvar turma/horário atualiza a grade pessoal e mantém a largura do documento dentro de 1280/390 pixels.
Isso não substitui um teste de persistência com conta real e banco configurado.
A extração real autenticada e as exportações em aplicativos continuam como verificações das próximas etapas.
