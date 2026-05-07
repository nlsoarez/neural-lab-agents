# Skill: Daily Market Report

## Metadata

```yaml
name: daily-market-report
version: "1.0"
description: Gera automaticamente o relatório diário de mercado de IA e automação
trigger: heartbeat
schedule: "0 7 * * *"
assignTo: "Market Intel Agent"
tags: [RELATORIO, MERCADO, AUTOMATICO]
```

## Description

Esta skill instrui o Market Intel Agent a executar sua rotina diária de pesquisa
e geração do relatório de mercado. É acionada automaticamente todo dia às 07:00 BRT.

## Task Template

Quando esta skill for executada, criar a seguinte issue:

**Título:** `📈 Relatório de Mercado — [DATA_HOJE]`
**Assignee:** Market Intel Agent
**Priority:** High
**Tags:** `[RELATORIO]`, `[MERCADO]`, `[AUTO]`

**Body:**
```
## Missão do Dia

Execute a rotina completa de análise de mercado conforme suas instruções em:
`agents/market-intel/instructions.md`

## Checklist de Entrega

- [ ] Pesquisar top 3 tendências de IA nas últimas 24h
- [ ] Verificar movimentos de concorrentes (shared/competitors.md)
- [ ] Identificar 1 oportunidade de conteúdo com janela de oportunidade
- [ ] Identificar 1 oportunidade de produto/serviço
- [ ] Atualizar shared/market_data.json com dados do dia
- [ ] Postar relatório completo neste issue como comentário
- [ ] Se houver ALERTA crítico, criar issue separada com tag [ALERTA]

## Formato do Relatório

Seguir EXATAMENTE a estrutura definida em agents/market-intel/instructions.md

## Deadline

Entrega até: 08:30 BRT (antes do CEO Agent acordar às 09:00)
```

## Outputs Esperados

1. Comentário no issue com relatório completo estruturado
2. `shared/market_data.json` atualizado
3. Issue separada com tag `[ALERTA]` se necessário
4. Issue fechada com status `done` após entrega

## Dependências

- SerpAPI ou Serper: para pesquisa web e Google Trends
- Acesso ao `shared/` directory
- Permissão para criar novas issues

## Escalação

Se o relatório não for entregue até 08:45:
→ CEO Agent (heartbeat 09:00) verifica automaticamente e cria alerta
