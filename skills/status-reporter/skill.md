# Skill: Status Reporter

## Metadata

```yaml
name: status-reporter
version: "1.0"
description: Template padronizado de relatório de status — todos os agentes usam o mesmo formato para reports internos e entregas
trigger: on-demand
assignTo: "*"
tags: [STATUS, RELATORIO, TEMPLATE]
```

## Description

Esta skill define o formato canônico de relatório usado por todos os agentes
do Neural Lab. Garante que qualquer output de status — diário, semanal, de
execução ou de alerta — siga a mesma estrutura, facilitando parsing automático,
consolidação pelo CEO Agent e histórico no Notion.

**Benefícios:**
- CEO Agent consolida relatórios de 4 agentes sem ambiguidade
- Automações futuras podem fazer parse estruturado
- Histórico no Notion fica consistente e pesquisável
- Reduz tokens gastos em formatting instructions repetidas

## Task Template

### Relatório de Execução (após completar uma task)

```markdown
# 📋 Status Report — [AGENT_NAME]

**Data:** [DATA_HORA_BRT]
**Issue:** #[ISSUE_NUMBER] — [ISSUE_TITLE]
**Status:** ✅ Concluído | ⚠️ Parcial | ❌ Falhou

---

## Resumo Executivo
[1-2 frases descrevendo o que foi feito e o resultado principal]

## Entregas
- [x] [Entrega 1 com link/referência]
- [x] [Entrega 2 com link/referência]
- [ ] [Entrega pendente, se houver]

## Métricas
| Métrica | Valor |
|---|---|
| Tokens utilizados | [N] |
| Turns realizados | [N] / [maxTurns] |
| Tempo de execução | [Xm Ys] |
| Ferramentas usadas | [lista] |

## Observações
[Insights, bloqueios encontrados, decisões tomadas]

## Próximos Passos
- [Ação recomendada 1]
- [Ação recomendada 2]

---
*Gerado por [AGENT_NAME] via skill status-reporter v1.0*
```

### Relatório Diário (resumo do dia)

```markdown
# 📊 Daily Summary — [AGENT_NAME]

**Data:** [DATA_BRT]
**Issues processados:** [N]
**Taxa de sucesso:** [X]%

---

## Tasks Completadas
1. **#[ID] [Título]** — ✅ [resultado em 1 linha]
2. **#[ID] [Título]** — ✅ [resultado em 1 linha]

## Tasks Pendentes
1. **#[ID] [Título]** — ⏳ [motivo/ETA]

## Consumo do Dia
| Recurso | Usado | Budget | % |
|---|---|---|---|
| Tokens (input) | [N] | [budget] | [X]% |
| Tokens (output) | [N] | [budget] | [X]% |
| Execuções | [N] | — | — |

## Alertas
- [⚠️ alerta, se houver, ou "Nenhum alerta"]

---
*Gerado por [AGENT_NAME] via skill status-reporter v1.0*
```

### Relatório de Alerta (situação crítica)

```markdown
# 🚨 ALERTA — [AGENT_NAME]

**Data:** [DATA_HORA_BRT]
**Severidade:** 🔴 Crítico | 🟡 Atenção | 🟠 Aviso
**Issue relacionada:** #[ID] (se aplicável)

---

## Descrição do Problema
[O que aconteceu, em 2-3 frases claras]

## Impacto
[O que está sendo afetado e quão urgente é]

## Ação Tomada
[O que o agente já fez para mitigar, se algo]

## Ação Recomendada
[O que o CEO/fundador deve fazer]

## Contexto Técnico
```
[Erro, log, ou dados relevantes para debug]
```

---
*Gerado por [AGENT_NAME] via skill status-reporter v1.0*
```

## Regras de Uso

1. **Sempre usar o template correto** para o tipo de relatório
2. **Nunca omitir seções** — se não aplicável, escrever "N/A"
3. **Métricas são obrigatórias** — tokens e turns devem ser reportados
4. **Timestamps em BRT** (UTC-3)
5. **Links para issues** devem usar formato `#[NUMBER]`
6. **Resumo Executivo** deve caber em 1-2 frases (para consolidação rápida)

## Integração com Notion

Ao salvar no Notion via skill `notion-sync`, usar:

```
NOTION_WRITE("OPS", {
  title: "[Tipo] — [Agent Name] — [Data]",
  date: "[DATA_ISO]",
  type: "Daily" | "Execution" | "Alert",
  agents_involved: ["[AGENT_NAME]"],
  summary: "[Resumo Executivo — 1-2 frases]"
})
```

## Outputs Esperados

1. Relatório formatado conforme o template correto
2. Relatório salvo como comentário no issue (se aplicável)
3. Relatório salvo no Notion DB `OPS` via `notion-sync`
4. Alertas críticos geram issue separada com tag `[ALERTA]`

## Dependências

- Skill `notion-sync` para persistência no Notion
- Acesso a métricas de execução (tokens, turns, tempo)
- Permissão para comentar e criar issues
