/**
 * One-off transform: read TAIL's site CSVs from data/tail-source/ and emit rows
 * for data/projetos-backfill.csv.
 *
 * The body text for each project is hand-elaborated based on what's in
 * descricao_proj plus the diretoria + period metadata. Elaborations live in
 * the ELABORATIONS map keyed by id_proj.
 *
 * Run with:  npx tsx scripts/build-tail-backfill.ts
 */
import fs from "node:fs";
import path from "node:path";

// --- Tiny CSV parser (handles "quoted, fields", escaped "" quotes, CRLF) ---
function parseCSV(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  if (input.charCodeAt(0) === 0xfeff) {
    i = 1;
  }
  while (i < input.length) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      if (c === "\r" && input[i + 1] === "\n") {
        i += 2;
      } else {
        i++;
      }
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].length > 0));
}

function readCSV<T extends Record<string, string>>(filePath: string): T[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const rows = parseCSV(raw);
  if (rows.length === 0) {
    return [];
  }
  const header = rows[0];
  return rows.slice(1).map(r => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj as T;
  });
}

function quoteCSV(value: string): string {
  if (value === "") {
    return "";
  }
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function writeCSV(filePath: string, header: string[], rows: string[][]) {
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(r.map(quoteCSV).join(","));
  }
  fs.writeFileSync(filePath, lines.join("\n") + "\n", "utf-8");
}

function formatPeriod(p: string): string {
  const m = p.match(/^(\d{2})_(\d)$/);
  if (!m) {
    return p;
  }
  return `20${m[1]}.${m[2]}`;
}

const CARGO_PRIORITY: Record<string, number> = {
  "Orientador(a)": 0,
  Diretor: 1,
  Líder: 2,
  Membro: 3,
  Colaborador: 4,
};

function cargoRank(c: string): number {
  return CARGO_PRIORITY[c] ?? 99;
}

function bucketLink(link: string): {
  urlRepo: string;
  urlDemo: string;
  urlOutro: string;
} {
  const out = { urlRepo: "", urlDemo: "", urlOutro: "" };
  if (!link) {
    return out;
  }
  const trimmed = link.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return out;
  }
  if (/github\.com|gitlab\.com|bitbucket\.org/i.test(trimmed)) {
    out.urlRepo = trimmed;
  } else if (/herokuapp|netlify|vercel|streamlit|huggingface\.co\/spaces/i.test(trimmed)) {
    out.urlDemo = trimmed;
  } else {
    out.urlOutro = trimmed;
  }
  return out;
}

// --- Hand-elaborated project bodies. Keyed by id_proj. ---
// Each body is HTML-ready (will be wrapped in <p> tags by Tiptap when edited).
// The script appends a final paragraph with diretoria + periodos + autores.
const ELABORATIONS: Record<string, string> = {
  "4c91a34d-ff6c-486e-b140-8efd3db97d75": `O projeto teve como meta criar um sistema capaz de analisar partidas de Goalball — esporte paralímpico jogado por atletas com deficiência visual — em tempo real ou a partir de vídeos gravados. A partir da análise, o sistema gera relatórios com métricas e padrões de jogo que servem como insumo para treinadores tomarem decisões táticas e técnicas.

Por se tratar de um esporte com regras específicas (jogadores em quadra com olhos vendados rebatendo uma bola sonora), o desafio combina visão computacional com lógica de partido para extrair informações úteis do vídeo.`,

  "17811a84-485f-4630-b9a9-4344b88a61ef": `O MonitorAI foi desenvolvido como uma ferramenta para detecção de motoqueiros com e sem capacetes em tempo real, a partir de imagens cedidas pela SEMOB-PB (Superintendência de Mobilidade Urbana). O modelo principal é um YOLOv5 com fine-tuning, complementado por experimentos comparativos com Faster R-CNN.

Foram coletados vários minutos de filmagens de avenidas de João Pessoa para o conjunto de treinamento, e a equipe testou diversas abordagens de anotação e ajuste de hiperparâmetros para extrair o melhor desempenho dos modelos.`,

  "dfbc0eaf-9ddd-42ae-ba06-0d60d996ec79": `A ideia inicial era criar um sistema de recomendações a partir da relação entre os valores de ações e o IPCA. Como primeiro experimento, a equipe comparou o petróleo com o IPCA, esperando uma correlação alta — mas os resultados da Análise Exploratória de Dados (EDA) acabaram não suportando a hipótese, e o projeto foi reorientado.

A trajetória ilustra um ciclo comum em ciência de dados: formular uma hipótese, deixar os dados falarem e ajustar (ou abandonar) o caminho de acordo com o que a EDA mostra.`,

  "d1e41613-df0d-45f6-80ab-f5930d53e65b": `O WaveFlow é uma aplicação para músicos e entusiastas que querem tocar sem a fricção de ter que rolar páginas de partitura entre uma seção e outra. O sistema usa um modelo de classificação de acordes para acompanhar o que está sendo tocado e atualizar a interface conforme o instrumentista avança pela peça.

Além da aplicação principal, o projeto disponibiliza uma API independente com o serviço de classificação de acordes, permitindo que outros projetos integrem essa funcionalidade ao próprio fluxo.`,

  "491cb9e7-daa9-40c3-a816-9edff3a7d2d7": `Material introdutório voltado a ensinar Python no contexto de modelagem estatística e Machine Learning. O conteúdo cobre os fundamentos de manipulação de dados e a lógica básica para construir modelos preditivos, servindo como ponto de partida para os novos integrantes da liga. O repositório com os notebooks está hospedado no GitHub da TAIL.`,

  "b0d460c8-9930-40b0-ac0f-5bbbc01b5e65": `Participação no desafio organizado pela startup Rei do Pitaco, com foco na previsão dos resultados da Copa do Mundo de 2022. A equipe modelou as partidas usando dados históricos de seleções e métricas de desempenho para gerar previsões de placar e classificação dos jogos.`,

  "d62a879f-5d9d-470a-abc2-fde2f7881e68": `Sistema de recomendação de filmes construído sobre dados do IMDB, usado como projeto-laboratório para consolidar conceitos vistos ao longo do semestre: colinearidade entre features, distância euclidiana e clustering com KMeans, entre outras técnicas. O resultado é um pipeline que parte da exploração dos dados até a recomendação propriamente dita.`,

  "97f0c155-5cde-4bbf-a22d-2e01efe97b1f": `Análise de um dataset americano com 52 anos de registros (2069 ocorrências) sobre violência em escolas. O estudo, feito pela Diretoria de Trainees, traçou perfis de atiradores, vítimas e estados, e avançou para uma análise preditiva inicial — explorando como informações históricas podem ajudar a entender padrões e fatores de risco associados a esse tipo de evento.`,

  "e135ba68-f984-4063-bd03-e2ca40bb2381": `Sistema de reconhecimento e classificação de pessoas voltado para aumentar a segurança em locais públicos, com aplicação direta no Centro de Informática (CI) da UFPB. O projeto envolve detecção facial, comparação com uma base cadastrada e classificação do nível de acesso esperado em cada área.`,

  "b53b039b-024b-4e19-aabf-15a387a36f63": `Estufa para coentro que utiliza aprendizagem por reforço para minimizar o consumo de água e energia, ao mesmo tempo em que maximiza o bem-estar da planta. Sensores monitoram condições ambientais e de irrigação, e um agente RL aprende quando ativar bombas, lâmpadas e ventilação para manter o cultivo saudável de forma eficiente.`,

  "6ed87f05-c89a-4053-9a46-d3446d2c2503": `Projeto formativo em que todos os membros foram treinados em OpenCV para construir seus próprios modelos de visão computacional capazes de identificar anomalias — como tumores — em exames de Ressonância Magnética. O foco era duplo: produzir modelos funcionais e fortalecer a base técnica de cada integrante em processamento de imagens médicas.`,

  "a79da058-1021-472a-8e21-ca1b3b0c96ff": `Projeto-introdutório montado para apresentar Data Science e Machine Learning aos novos integrantes. A primeira parte trabalha com dados públicos de segurança do estado de São Paulo (análise descritiva) e a segunda com um dataset sintético de transações de cartão de crédito (classificação de fraude) — combinando exploração de dados com um problema clássico de detecção desbalanceado.`,

  "0b7412d3-2714-4f2f-a290-3687076c564b": `O LinguifAI é uma aplicação desktop de Processamento de Linguagem Natural (PLN) que torna ferramentas de classificação de texto acessíveis a usuários não técnicos. A interface guia o usuário no carregamento dos dados, na configuração e treinamento de redes neurais personalizadas, e no uso do modelo treinado para inferência — tudo sem a necessidade de escrever código.`,

  "19b5c26c-97dc-4b92-8692-ebc527d710ee": `O projeto consiste em uma API para transcrição de acordos energéticos a partir de imagens. A ferramenta combina reconhecimento óptico de caracteres com uma camada de validação capaz de apontar erros prováveis na transcrição e propor correções, reduzindo o esforço manual de revisão pós-OCR.`,

  "d12b3853-cf00-4446-b6b7-40e0327d3feb": `Trilha educativa com foco em mostrar a matemática que sustenta modelos estatísticos e de Inteligência Artificial. O conteúdo cobre álgebra linear, cálculo, probabilidade e estatística no contexto em que aparecem na prática de modelagem — para que os integrantes desenvolvam intuição além de aplicar fórmulas.`,

  "7eb34aa9-1bbd-4406-ae0b-b375b49861bb": `Narrador artificial de partidas de futebol baseado em visão computacional. O sistema processa o vídeo do jogo, identifica eventos relevantes (passes, gols, faltas) e gera narração em tempo real — combinando detecção e rastreamento de objetos com geração de texto contextualizada para cada situação reconhecida em campo.`,

  "6a0e449f-aff0-4fa0-80cd-82017719e58b": `Trabalho contínuo de revisão de posts, arquivamento de conteúdo histórico e planejamento de novas pautas para o Instagram da TAIL. A diretoria responsável pela comunicação externa atua para manter a presença da liga consistente, organizada e relevante para a comunidade.`,

  "34389c0e-fd56-4816-8b74-eeeea69bf4c2": `Aplicativo de rede social voltado para competições de treino em academia. Os usuários cadastram seus exercícios, registram cargas e séries, e disputam rankings com outros membros — gamificando a rotina e aproximando quem treina nos mesmos espaços.`,

  "2240f50a-cbcc-46bb-8757-2fb8bacb9593": `Plataforma que automatiza a análise de sentimentos sobre reviews de aplicativos da Play Store. A solução filtra as avaliações mais relevantes, extrai metadados e identifica os principais pontos positivos e negativos mencionados pelos usuários — entregando uma visão consolidada útil para times de produto e times de mercado.`,

  "1a70dc29-bd9b-4c5d-91d7-fc83e7f3e20f": `Sistema automático para contagem e identificação de reticulócitos — células do tecido sanguíneo que dão pistas importantes em diagnósticos de doenças como anemia. Hoje, em laboratórios de pequeno e médio porte, essa contagem é feita manualmente; o ReticulAI propõe receber a imagem da lâmina e devolver a contagem, reduzindo tempo e variabilidade entre operadores.`,

  "dddfa86c-ad3d-44b5-aadd-9dfc6133a767": `Projeto pensado para incluir pessoas com deficiência visual no mundo da moda. O pipeline usa o YOLOv5 para identificar peças de roupa, um modelo de classificação para identificar suas cores e, em seguida, um modelo que descreve as roupas em texto — completado por uma camada de Text-to-Speech que entrega a descrição em áudio.`,

  "545c9f29-ebde-41a7-bf8a-2bafa2780012": `Ferramenta que recebe um artigo científico e gera automaticamente o seu abstract, um conjunto de palavras-chave e um título sugerido. O objetivo é apoiar pesquisadores no momento de redação e na organização de portfólios de publicações, oferecendo um primeiro rascunho razoável a partir do conteúdo.`,

  "3fd7b1c1-0a10-4d7c-996f-39c1287bb89a": `Estudo exploratório sobre uma base de músicas do Spotify e seus atributos (energia, valência, dançabilidade etc.). O objetivo foi entender as correlações entre essas variáveis e gerar insights sobre o que as define enquanto características musicais — apoiando-se em estatística descritiva e visualizações.`,

  "9c1165aa-fe4c-44a1-b58a-dc1ded3ff425": `Simulação de uma cadeia alimentar simples emulada por agentes de Aprendizado por Reforço. Cada espécie é um agente com sua função-objetivo (sobreviver, reproduzir, evitar predadores) e o ambiente evolui conforme os agentes interagem entre si — permitindo observar dinâmicas emergentes próximas a modelos predador-presa.`,

  "ad339c98-9011-4659-aaa8-fd3a406c61e6": `Projeto de sumarização de textos com aplicação direta na acessibilidade: reduzir um texto extenso para uma versão objetiva que possa ser convertida em Glosa e, dessa, para Libras. A redução do volume textual diminui o custo computacional da tradução automática para Libras e torna o processo mais ágil para o usuário surdo.`,

  "33e54636-78c9-4011-a50b-18b735bd6bf2": `Iniciativa da Diretoria Acadêmica para que seus integrantes leiam artigos científicos relevantes em IA e os apresentem para o restante da liga. Cada apresentação é curta e objetiva, criando um fluxo regular de troca de conhecimento e expondo todos os membros a frentes de pesquisa que talvez não estivessem em seu radar.`,

  "7a7858de-44c0-49f2-994a-4f781607d22f": `Planejamento e prototipação do novo site da TAIL. A iteração inicial mapeou requisitos, fluxos de navegação e identidade visual, deixando o terreno preparado para o desenvolvimento técnico subsequente.`,

  "7fade964-7189-4777-a33e-6d45e272c88c": `Resolução de pathfinding em um jogo de labirinto via Aprendizado por Reforço. O agente aprende, tentativa após tentativa, a achar o caminho até a saída — comparando a abordagem com algoritmos clássicos de busca e mostrando como RL pode resolver problemas com regras simples mas espaços de estado grandes.`,

  "881ae917-2819-475e-a928-0ef8b227fbb7": `A Diretoria Acadêmica se diferencia das demais por não estar orientada a um projeto técnico, e sim à produção de artigos científicos a partir de projetos antigos da TAIL e do ARIA. Os integrantes estudam o que foi feito, levantam o embasamento teórico necessário e escrevem o material com vista à submissão em eventos da área.`,

  "ce9c33b9-bf87-4a96-9db1-e92c22c894eb": `Projeto que utiliza dados abertos da Polícia Rodoviária Federal para construir um sistema voltado a reduzir os problemas enfrentados no trânsito brasileiro. A análise busca padrões em ocorrências (locais, horários, condições) que podem orientar políticas públicas, fiscalização e ações educativas.`,

  "d1ab95a2-f8e1-41f6-9d09-432fad58d543": `O Debyte! é uma série de análises construídas a partir de léxicos extraídos dos discursos políticos dos membros do congresso federal. A partir desses léxicos, a equipe explora padrões de linguagem, temas recorrentes e diferenças entre grupos — usando NLP como ferramenta para entender o discurso político brasileiro.`,

  "1ce17fde-1484-4e32-8b3d-263492c35564": `Como introdução ao mundo de dados e Inteligência Artificial, a equipe usou um dataset clínico para prever o estágio de cirrose em pacientes a partir de exames sanguíneos e outros indicadores hepáticos. O fluxo passou por Análise Exploratória de Dados e classificação com Regressão Logística, Árvores de Decisão e Redes Neurais, com bons resultados nos modelos finais.`,

  "fba79eaf-c776-403b-9b79-ce7de9f60f5d": `O CroissAInt é um modelo que usa Reinforcement Learning para tentar estimar o próximo movimento de um ativo financeiro. O nome é uma piada com a propaganda recorrente de cursos de investimento que prometem pagar um croissant e um café com o lucro acumulado durante o consumo deles — referência leve para um problema sério de previsão financeira.`,

  "b9c26935-566a-48af-9fa3-f480bbd79b66": `Estudo descritivo sobre dados de acidentes de tráfego no Brasil entre 2007 e 2022, registrados pela Polícia Rodoviária Federal. A análise percorreu causas principais, consequências mais frequentes e variações ao longo do tempo, gerando insights que ajudam a contextualizar a problemática para qualquer leitor — técnico ou não.`,

  "163041db-a7cf-4df5-b86c-962dc51d801c": `Pipeline de visualização e ETL dos dados da própria liga acadêmica. O TailDb organiza informações sobre membros, projetos e rotações em uma estrutura consultável, facilitando análises internas e a manutenção dos registros históricos da TAIL.`,

  "2d2a994c-969b-44c7-945c-8f4d2559d020": `Projeto que detecta sentimentos a partir de uma sequência de acordes (progressão harmônica). O resultado é apresentado em uma interface que mostra emojis correspondentes ao "sentimento" que aquela progressão evoca — combinando teoria musical com classificação por NLP/ML.`,

  "b76c630e-7d6c-45b4-b21c-3bd75b597878": `Desenvolvimento do site institucional da TAIL conectado ao banco de dados atualizado e construção de uma interface de cadastro completa: membros, projetos, rotações e demais dados úteis para a operação da liga. O resultado dá autonomia para a equipe gerir as informações sem precisar editar arquivos manualmente.`,

  "71f61870-61e7-4f77-b3c2-dea1245b2861": `Site para a criação de zoom arts — animações de zoom "infinito" construídas a partir de imagens geradas por StableDiffusion. O usuário escolhe um tema/prompt e o sistema gera o conjunto de quadros que, encadeados, produzem o efeito de zoom contínuo que se aprofunda em novos cenários.`,

  "8642a99f-999e-4515-855d-459ff199ea5f": `Diarização de voz aplicada a música: dada uma faixa cantada por mais de um intérprete, o sistema identifica em cada segmento de voz quem está cantando. O problema combina detecção de atividade vocal com classificação de timbre/identidade — útil para indexação e curadoria de música multi-vocal.`,
};

type Diretoria = { id_dir: string; nome_dir: string };
type Membro = { id_mem: string; nome_mem: string };
type Projeto = {
  id_proj: string;
  nome_proj: string;
  descricao_proj: string;
  tipo_proj: string;
  link_proj: string;
  imagem_proj_url: string;
};
type Rotacao = {
  id_rot: string;
  id_rot_dir: string;
  id_rot_proj: string;
  periodo_rot: string;
};
type RotacaoMembro = {
  id_rot_mem_fbk_rotacao: string;
  id_rot_mem_fbk_membro: string;
  cargo_rot_mem_fbk: string;
};

const SOURCE_DIR = "data/tail-source";
const TARGET_CSV = "data/projetos-backfill.csv";

const diretorias = readCSV<Diretoria>(path.join(SOURCE_DIR, "diretoria.csv"));
const membros = readCSV<Membro>(path.join(SOURCE_DIR, "membro.csv"));
const projetos = readCSV<Projeto>(path.join(SOURCE_DIR, "projeto.csv"));
const rotacoes = readCSV<Rotacao>(path.join(SOURCE_DIR, "rotacao.csv"));
const rotMembros = readCSV<RotacaoMembro>(path.join(SOURCE_DIR, "rotacao_membros_feedback.csv"));

void diretorias;
const nomeMembroById = new Map<string, string>(membros.map(m => [m.id_mem, m.nome_mem]));

const rotacoesByProjeto = new Map<string, Rotacao[]>();
for (const r of rotacoes) {
  const arr = rotacoesByProjeto.get(r.id_rot_proj) ?? [];
  arr.push(r);
  rotacoesByProjeto.set(r.id_rot_proj, arr);
}

const rotMembrosByRotacao = new Map<string, RotacaoMembro[]>();
for (const rm of rotMembros) {
  if (!rm.id_rot_mem_fbk_rotacao) {
    continue;
  }
  const arr = rotMembrosByRotacao.get(rm.id_rot_mem_fbk_rotacao) ?? [];
  arr.push(rm);
  rotMembrosByRotacao.set(rm.id_rot_mem_fbk_rotacao, arr);
}

const outRows: string[][] = [];

for (const p of projetos) {
  const rots = rotacoesByProjeto.get(p.id_proj) ?? [];

  const periodos = Array.from(new Set(rots.map(r => formatPeriod(r.periodo_rot))))
    .filter(Boolean)
    .sort();
  const tags = [p.tipo_proj, ...periodos].filter(Boolean).join(";");

  type AuthorAccum = { name: string; rank: number };
  const authorMap = new Map<string, AuthorAccum>();
  for (const r of rots) {
    const memberRows = rotMembrosByRotacao.get(r.id_rot) ?? [];
    for (const mr of memberRows) {
      const name = nomeMembroById.get(mr.id_rot_mem_fbk_membro);
      if (!name) {
        continue;
      }
      const rank = cargoRank(mr.cargo_rot_mem_fbk);
      const existing = authorMap.get(mr.id_rot_mem_fbk_membro);
      if (!existing) {
        authorMap.set(mr.id_rot_mem_fbk_membro, { name, rank });
      } else if (rank < existing.rank) {
        existing.rank = rank;
      }
    }
  }
  const authors = Array.from(authorMap.values()).sort(
    (a, b) => a.rank - b.rank || a.name.localeCompare(b.name)
  );
  const authorNames = authors.map(a => a.name);

  // Compose body — elaboration if we have one, else fall back to descricao
  const bodyParts: string[] = [];
  const elaboration = ELABORATIONS[p.id_proj];
  if (elaboration) {
    bodyParts.push(elaboration.trim());
  } else if (p.descricao_proj.trim()) {
    bodyParts.push(p.descricao_proj.trim());
  }

  // Context line
  const contextBits: string[] = [];
  if (p.tipo_proj) {
    contextBits.push(`diretoria de ${p.tipo_proj}`);
  }
  if (periodos.length > 0) {
    contextBits.push(`período(s): ${periodos.join(", ")}`);
  }
  if (authorNames.length > 0) {
    contextBits.push(`${authorNames.length} integrantes`);
  }
  if (contextBits.length > 0) {
    bodyParts.push(`_Projeto da ${contextBits.join(" — ")}._`);
  }

  if (authorNames.length > 0) {
    bodyParts.push(`---\n\nAutores: ${authorNames.join(", ")}`);
  }
  const text = bodyParts.join("\n\n");

  const firstSentence = (() => {
    const trimmed = p.descricao_proj.trim();
    if (!trimmed) {
      return "";
    }
    const dotIdx = trimmed.search(/[.!?](\s|$)/);
    const candidate = dotIdx > 0 ? trimmed.slice(0, dotIdx + 1) : trimmed;
    return candidate.length > 200 ? candidate.slice(0, 197) + "..." : candidate;
  })();

  const { urlRepo, urlDemo, urlOutro } = bucketLink(p.link_proj);

  outRows.push([
    p.nome_proj,
    firstSentence,
    text,
    tags,
    urlRepo,
    urlDemo,
    urlOutro,
    p.imagem_proj_url || "",
    "TAIL",
    authorNames.join(";"),
  ]);
}

const HEADER = [
  "titulo",
  "subtitulo",
  "text",
  "tags",
  "urlRepo",
  "urlDemo",
  "urlOutro",
  "urlImagem",
  "entidades",
  "autores",
];

writeCSV(TARGET_CSV, HEADER, outRows);

const elaboratedCount = projetos.filter(p => ELABORATIONS[p.id_proj]).length;
console.log(`Wrote ${outRows.length} rows to ${TARGET_CSV}`);
console.log(`Elaborated bodies: ${elaboratedCount} / ${outRows.length}`);
