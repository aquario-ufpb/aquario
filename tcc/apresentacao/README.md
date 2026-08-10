# Apresentação da defesa

Base para você adaptar. **Não é para apresentar como está** — é esqueleto,
ordem e números conferidos.

## Compilar

    cd apresentacao
    tectonic -X compile slides.tex --outdir build

Sai em `build/slides.pdf`. As figuras vêm de `../figuras/`, as mesmas da
monografia — se trocar uma lá, muda aqui também.

## Estrutura

| bloco | slides | ideia |
|---|---|---|
| Abertura | 1 | capa |
| Problema | 2–3 | fragmentação, quem perde |
| Trabalhos relacionados | 4–5 | o que já existe, quadro comparativo |
| Objetivo | 6 | |
| O sistema | 7–9 | landing, dez módulos, grade de telas |
| Decisões | 10–12 | os cinco critérios, arquitetura, CI/CD |
| Método | 13–15 | natureza do estudo, as quatro etapas, o recorte e as três fontes |
| Resultados | 16–19 | acervo, uso efetivo, alcance, o que falhou |
| Comunidade | 20 | contribuidores e continuidade |
| Fecho | 21–23 | limitações, trabalhos futuros, o que fica |
| Reserva | 24+ | só se a pergunta vier |

Vinte e três slides para ~20 minutos. Os `\pause` fazem o conteúdo aparecer por
partes; se preferir slide cheio de uma vez, apague todos eles.

## Os slides de reserva

Ficam depois do `\appendix`, então não entram na numeração. São as respostas
para as perguntas mais prováveis:

- verificação dos requisitos, com o que não passou
- por que analytics e banco divergem (148 × 157)
- tratamento dos dados e a lacuna de LGPD
- stack e serviços, todos em plano gratuito
- modelo de dados

Não apresente. Deixe abertos numa segunda janela, ou pule até eles se
perguntarem.

## O que você precisa decidir

**O slide 17 é o mais importante da defesa.** É o dos 82,2% e 77,1%. A frase
de apoio menciona que as etapas podiam ser puladas — isso responde à objeção
mais provável, que é confundir uso da ferramenta com preenchimento do
cadastro. Se conseguir o número do funil de onboarding antes do dia, é ali
que ele entra.

**O slide 19 mostra o que não foi atendido.** Contra o instinto, mantenha.
Apresentar a falha antes que perguntem tira a força da pergunta, e o parecer
de leitura crítica apontou a honestidade como um dos pontos fortes do
trabalho.

**A capa usa o logo da UFPB.** Se o programa exigir outro brasão ou uma folha
de rosto específica, troque em `logo-ufpb.png`.

## Ajustes rápidos

Cor principal: `\definecolor{azul}{HTML}{1F5FBF}` — é o azul do Aquário.

Para 4:3 em vez de widescreen, troque `aspectratio=169` por `aspectratio=43`
na primeira linha.

Números grandes usam `\bignum{valor}{legenda}` — quatro por linha cabem bem.
