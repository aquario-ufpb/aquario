# Apresentação de defesa — TCC

Slides da defesa do trabalho de conclusão de curso sobre o Aquário,
apresentada em 7 de agosto de 2026 no Centro de Informática da UFPB.

## Como abrir

O deck é uma página HTML sem dependências externas — nada de CDN, nada de
build. Basta abrir no navegador:

    open apresentacao/slides.html

| tecla | ação |
|---|---|
| → · espaço · clique | avançar |
| ← · clique direito | voltar |
| `F` | tela cheia |
| `P` | imprimir / exportar PDF |

`apresentacao-aquario.pdf` é a exportação pronta, para quem só quer ler.

## O que tem aqui

```
tcc/
├── apresentacao/
│   ├── slides.html        o deck (60 slides)
│   ├── slides.tex         versão anterior, em Beamer
│   ├── timelines.tex      linhas do tempo das releases, em TikZ
│   ├── estruturas.md      árvores de diretório usadas nos slides
│   ├── assets/            marca, brasão e logos dos serviços
│   └── build/             PDFs gerados a partir dos .tex
├── figuras/               capturas de tela e diagramas
└── apresentacao-aquario.pdf
```

As imagens de `figuras/` são as mesmas da monografia. O `slides.html` aponta
para elas por caminho relativo (`../figuras/`), então mantenha as duas pastas
lado a lado.

## Para editar

Cores e tipografia ficam no bloco `:root` do `slides.html` — mudar ali muda o
deck inteiro. Cada slide é uma `<section class="slide">`.

Para gerar o PDF de novo depois de editar:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --no-pdf-header-footer --virtual-time-budget=14000 \
  --print-to-pdf=apresentacao-aquario.pdf \
  "file://$PWD/apresentacao/slides.html"
```
