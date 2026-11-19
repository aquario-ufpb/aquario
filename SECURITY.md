# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

---

### Automações de manutenção

Restrinja o environment `repository-maintenance` à branch protegida `main`.
Os jobs de atualização dos submódulos e de dados PAAS usam o `GITHUB_TOKEN`
por padrão. Se o repositório precisar de uma identidade dedicada para o push,
guarde `MAINTENANCE_TOKEN_PAT` apenas nesse environment e conceda escrita de
conteúdo somente neste repositório. Na transição, revogue o antigo `TOKEN_PAT`
depois de conferir os consumidores e remova a cópia dos secrets de repositório
ou organização acessíveis a workflows de PR.
