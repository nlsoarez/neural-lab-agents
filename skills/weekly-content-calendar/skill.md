# Skill: Weekly Content Calendar

## Metadata

```yaml
name: weekly-content-calendar
version: "1.0"
description: Gera o plano de marketing e calendário editorial completo da semana
trigger: heartbeat
schedule: "0 8 * * 1"
assignTo: "Marketing & Copy Agent"
tags: [MARKETING, CALENDARIO, SEMANAL, AUTOMATICO]
```

## Description

Esta skill ativa a geração semanal do calendário editorial. É executada toda segunda-feira:
- 08:00 — Marketing & Copy Agent gera o plano e copy da semana
- 10:00 — Social Media & Design Agent (skill separada) gera o calendário visual

## Task Template — Marketing Agent (08:00)

**Título:** `📣 Marketing Week — W[NUMERO_SEMANA]/[ANO]`
**Assignee:** Marketing & Copy Agent
**Priority:** High
**Tags:** `[MARKETING]`, `[SEMANAL]`, `[AUTO]`

**Body:**
```
## Missão da Semana

Execute o planejamento semanal de marketing conforme agents/marketing/instructions.md

## Inputs Necessários

Antes de começar, leia:
1. Os últimos 5 relatórios do Market Intel Agent (issues com tag [RELATORIO])
2. O relatório de mercado de hoje (deve estar pronto às 07:30)
3. shared/brand_guidelines.md
4. shared/target_audience.md

## Checklist de Entrega

- [ ] Definir narrativa central da semana (1 frase)
- [ ] Criar tabela de conteúdo: dia × plataforma × formato × tema × hook
- [ ] Produzir 5 headlines com variações A/B para cada tema principal
- [ ] Produzir 3 CTAs para os posts principais
- [ ] Produzir pelo menos 1 email da sequência de nurturing (se aplicável)
- [ ] Se houver campanha ativa: produzir copy completo
- [ ] Postar plano completo como comentário neste issue
- [ ] Marcar issue como done após entrega

## Formato de Entrega

Seguir estrutura definida em agents/marketing/instructions.md

## Deadline

Entrega até: 09:30 BRT
(Social Agent aguarda este plano para iniciar às 10:00)
```

## Task Template — Social Agent (10:00)

Após o Marketing Agent completar, criar automaticamente:

**Título:** `📅 Content Calendar — W[NUMERO_SEMANA]/[ANO]`
**Assignee:** Social Media & Design Agent
**Priority:** High
**Tags:** `[CALENDARIO]`, `[CONTEUDO]`, `[AUTO]`
**Blocker:** Issue "Marketing Week" deve estar done

**Body:**
```
## Missão da Semana

Execute a geração do calendário editorial visual conforme agents/social/instructions.md

## Inputs Necessários

1. Issue "📣 Marketing Week — W[N]/[ANO]" (deve estar concluída)
2. shared/brand_guidelines.md (OBRIGATÓRIO antes de qualquer visual)
3. shared/market_data.json (tendências da semana)

## Checklist de Entrega

- [ ] Gerar 7 posts (um por dia, plataforma prioritária)
- [ ] Para cada post: hook, legenda Instagram, legenda LinkedIn, script TikTok
- [ ] Para cada post: prompt de imagem completo e detalhado
- [ ] Para cada post: melhor horário de publicação + hashtags
- [ ] Atualizar shared/content_calendar.json com todos os posts
- [ ] Postar calendário completo como comentário neste issue
- [ ] Marcar para revisão do CEO Agent com tag [AGUARDA APROVAÇÃO]

## Formato de Entrega

Seguir estrutura definida em agents/social/instructions.md

## Deadline

Entrega até: 13:00 BRT segunda-feira
```

## Outputs Esperados

**Marketing Agent (até 09:30):**
- Issue com plano de marketing da semana
- Copy completo de todos os posts
- Headlines, CTAs, scripts

**Social Agent (até 13:00):**
- Calendário editorial 7 dias com todos os elementos
- Prompts de imagem por post
- `shared/content_calendar.json` atualizado

**Resultado final:**
Na segunda-feira ao meio-dia, toda a semana está planejada e pronta para execução.
