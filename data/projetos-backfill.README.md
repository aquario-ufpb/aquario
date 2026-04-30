# Projetos backfill

CSV template for collecting projects to import into the DB later.

## Columns

| Column | Notes |
|---|---|
| `titulo` | Project name. Max 255. |
| `subtitulo` | One-line tagline shown on cards + above the body on the detail page. Max 500. |
| `text` | Long-form body (HTML or plain). Max 50,000. The `autores` list will be auto-appended at the end as `Autores: X, Y, Z`. |
| `tags` | Semicolon-separated, e.g. `react;web;ai`. |
| `urlRepo` | Repo URL. Full URL with `https://`. |
| `urlDemo` | Demo URL. |
| `urlOutro` | Any other link (Medium post, paper, etc.). |
| `urlImagem` | Cover image URL (full URL — Google Drive, hosted asset, etc.). |
| `entidades` | Semicolon-separated entidade names from the list below. These become the project's principal authors. Most projects have one. |
| `autores` | Semicolon-separated **person names** (free text — not slugs, doesn't need to be in DB). These get linked as users at insert time *if* they exist in the DB; otherwise just shown in the body footer. |

CSV escaping: any field containing a comma, newline, or `"` must be wrapped in double quotes. To include a literal `"` inside a quoted field, double it: `""`.

## Entidades reference

Use the `name` column verbatim in the `entidades` field.

| Name | Tipo | Slug |
|---|---|---|
| Aquário | GRUPO_ESTUDANTIL | aquario |
| ARIA | LABORATORIO | aria |
| Atoptima | EMPRESA | atoptima |
| B3 | EMPRESA | b3 |
| CACDIA | CENTRO_ACADEMICO | cacdia |
| CACIC | CENTRO_ACADEMICO | cacic |
| CAECOMP | CENTRO_ACADEMICO | caecomp |
| Cajueiro Motos | EMPRESA | cajueiro-motos |
| Cangaço no Espaço | GRUPO_ESTUDANTIL | cangaco-no-espaco |
| CapyBots | GRUPO_ESTUDANTIL | capybots |
| Cebraspe | EMPRESA | cebraspe |
| Compilada | ATLETICA | compilada |
| Connecta CI | GRUPO_ESTUDANTIL | connecta-ci |
| CortechX | LIGA_ACADEMICA | cortechx |
| DATAVIS | LABORATORIO | datavis |
| DHARMA-AI | EMPRESA | dharma-ai |
| Dhauz | EMPRESA | dhauz |
| EstudoPlay | EMPRESA | estudoplay |
| IEEE | GRUPO_ESTUDANTIL | ieee |
| LAGID | LABORATORIO | lagid |
| LAPORTE | LABORATORIO | laporte |
| LAR | LABORATORIO | lar |
| LASER | LABORATORIO | laser |
| LASID | LABORATORIO | lasid |
| LAVID | LABORATORIO | lavid |
| LIAA | LABORATORIO | liaa |
| LIM | LABORATORIO | lim |
| LMI | LABORATORIO | lmi |
| LOG | LABORATORIO | log |
| LUMO | LABORATORIO | lumo |
| MCC | GRUPO_ESTUDANTIL | mcc |
| Núcleo Colab | GRUPO_ESTUDANTIL | colab |
| PaCode | GRUPO_ESTUDANTIL | pacode |
| PET | GRUPO_ESTUDANTIL | pet |
| QUASAR | LIGA_ACADEMICA | quasar |
| Softcom | EMPRESA | softcom |
| Synchro | EMPRESA | synchro |
| TAIL | LIGA_ACADEMICA | tail |
| TNS-LATAM | EMPRESA | tns-latam |
| TRE-PB | EMPRESA | tre-pb |
| TRIL | LABORATORIO | tril |
| Trilha | GRUPO_ESTUDANTIL | trilha |
| Vsoft | EMPRESA | vsoft |
| Zoox Smart Data | EMPRESA | zoox-smart-data |
