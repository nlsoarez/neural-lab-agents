# Skill: Notion Sync

## Metadata

```yaml
name: notion-sync
version: "1.0"
description: Leitura e escrita estruturada no Notion — abstrai IDs, schemas e operações CRUD para todos os databases do Neural Lab
trigger: on-demand
assignTo: "*"
tags: [NOTION, SYNC, DADOS]
```

## Description

Esta skill fornece a todos os agentes uma interface padronizada para interagir com
os databases do Notion, eliminando instruções manuais de como acessar cada DB.
Em vez de cada agente precisar saber IDs, schemas e formatos, basta invocar
as operações definidas aqui.

A skill é lazy-loaded: só é injetada no contexto quando o agente precisa
ler ou escrever no Notion (detectado pelas tags `[NOTION]` ou `[SYNC]`).

## Databases Disponíveis

### Referência (Read-Only)

| Alias | Database | ID |
|---|---|---|
| `BRAND` | Brand Guidelines | `35a72546-0964-81ec-8fc2-d76fb938bf60` |
| `PRICING` | Pricing Matrix | `35a72546-0964-81af-aa00-e48676166157` |
| `AUDIENCE` | Target Audience | `35a72546-0964-81df-b3d0-e898c73f913b` |
| `COMPETITORS` | Competitors | `35a72546-0964-810b-8a10-db6f9c499246` |

### Operacionais (Read/Write)

| Alias | Database | ID |
|---|---|---|
| `REPORTS` | Relatórios de Mercado | `35a72546-0964-81fc-929f-fdc7d90abdd6` |
| `CALENDAR` | Content Calendar | `35a72546-0964-81cd-838a-c7cd0b9664e7` |
| `OPS` | Ops Summaries | `35a72546-0964-817e-8002-e8891803039e` |
| `PROPOSALS` | Propostas Comerciais | `35a72546-0964-8184-b9bb-dee53ffabae1` |

## Task Template

Quando um agente precisar interagir com o Notion, usar as seguintes operações:

### Leitura

```
NOTION_READ(alias, filtro?)

Exemplos:
  NOTION_READ("REPORTS")                           → últimas 10 páginas
  NOTION_READ("REPORTS", { date: "2026-05-10" })   → relatório do dia
  NOTION_READ("CALENDAR", { status: "Draft" })     → rascunhos pendentes
  NOTION_READ("BRAND")                             → guidelines completas
  NOTION_READ("COMPETITORS")                       → lista de concorrentes
```

### Escrita

```
NOTION_WRITE(alias, dados)

Exemplos:
  NOTION_WRITE("REPORTS", {
    title: "📈 Relatório de Mercado — 2026-05-10",
    status: "Published",
    agent: "Market Intel",
    content: "..."
  })

  NOTION_WRITE("CALENDAR", {
    title: "Post: 5 tendências IA",
    date: "2026-05-12",
    platform: "LinkedIn",
    status: "Scheduled",
    agent: "Social Media"
  })

  NOTION_WRITE("PROPOSALS", {
    title: "Proposta — Cliente ABC",
    tier: "Scale",
    value: 4500,
    status: "Draft",
    agent: "Pricing"
  })
```

### Atualização

```
NOTION_UPDATE(alias, page_id, dados)

Exemplo:
  NOTION_UPDATE("CALENDAR", "page-id-123", { status: "Published" })
```

## Schema por Database

### REPORTS
- `title` (title): Nome do relatório
- `date` (date): Data do relatório
- `agent` (select): Agente que gerou
- `status` (select): Draft | Published | Archived
- `content` (rich_text): Corpo do relatório

### CALENDAR
- `title` (title): Título do conteúdo
- `date` (date): Data de publicação
- `platform` (multi_select): LinkedIn | Twitter | Blog | Newsletter
- `status` (select): Idea | Draft | Scheduled | Published
- `agent` (select): Agente responsável
- `content` (rich_text): Texto do conteúdo

### OPS
- `title` (title): Título do resumo
- `date` (date): Data
- `type` (select): Daily | Weekly | Alert
- `agents_involved` (multi_select): Agentes envolvidos
- `summary` (rich_text): Resumo executivo

### PROPOSALS
- `title` (title): Nome da proposta
- `client` (rich_text): Nome do cliente
- `tier` (select): Starter | Growth | Scale | Enterprise
- `value` (number): Valor em BRL
- `status` (select): Draft | Sent | Accepted | Rejected
- `agent` (select): Agente que gerou

## Outputs Esperados

1. Operação executada com sucesso no Notion
2. Confirmação do page_id criado/atualizado no comentário do issue
3. Em caso de erro, log detalhado com o alias e operação tentada

## Dependências

- `NOTION_API_KEY` configurada como variável de ambiente
- Notion SDK (`@notionhq/client`)
- Permissão de integração nos databases listados

## Regras

- **Nunca hardcode IDs** — sempre usar os aliases desta skill
- **Rate limit**: máximo 3 requests/segundo ao Notion API
- **Retry**: até 2 retries com backoff exponencial em caso de 429/5xx
- **Validação**: verificar campos obrigatórios antes de WRITE/UPDATE
