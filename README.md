# Neural Lab — Sistema Operacional de Agentes IA

> Crie ativos com IA. Automatize. Escale.

Sistema multiagente rodando 24h no Railway via Paperclip.
5 agentes especializados orquestrados para automatizar toda a operação do Neural Lab.

---

## Arquitetura

```
CEO Agent (Operations Director) — Claude Opus 4.7
├── Market Intel Agent          — Claude Sonnet 4.6 [daily 07:00]
├── Marketing & Copy Agent      — Claude Sonnet 4.6 [weekly Mon 08:00]
├── Social Media & Design Agent — Claude Sonnet 4.6 [weekly Mon 10:00]
└── Pricing & Proposals Agent   — Claude Sonnet 4.6 [on-demand]
```

## O Que o Sistema Faz Automaticamente

| Quando | O Quê |
|---|---|
| Todo dia às 07:00 | Relatório de mercado + tendências de IA |
| Todo dia às 09:00 | CEO revisa, delega e gera Ops Summary |
| Segunda 08:00 | Plano de marketing + copy da semana |
| Segunda 10:00 | Calendário editorial completo (7 dias) |
| On-demand | Proposta comercial em < 2h via briefing |

---

## Setup Rápido

### Pré-requisitos
- Conta no [Railway](https://railway.app)
- [Anthropic API Key](https://console.anthropic.com)
- [SerpAPI Key](https://serpapi.com) (recomendado)

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/neural-lab-agents.git
cd neural-lab-agents
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas chaves
```

### 3. Deploy no Railway

**Opção A — Via Railway CLI:**
```bash
npm install -g @railway/cli
railway login
railway new
railway up
```

**Opção B — Via GitHub (Recomendado):**
1. Push do repositório para o GitHub
2. Acesse [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Selecione este repositório
4. Adicione as variáveis de ambiente (ver `.env.example`)
5. Adicione um serviço PostgreSQL ao projeto
6. Deploy automático

### 4. Importar a Company no Paperclip

Após o deploy, acesse o terminal do Railway:
```bash
npx paperclipai company import /app/neural-lab-agents
```

### 5. Verificar agentes

Acesse `https://neural-lab.up.railway.app` e verifique:
- [ ] 5 agentes aparecem no org chart
- [ ] Heartbeats configurados corretamente
- [ ] Shared context bank acessível

---

## Variáveis de Ambiente Obrigatórias

| Variável | Onde obter |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `BETTER_AUTH_SECRET` | `openssl rand -hex 32` |
| `DATABASE_URL` | Railway → PostgreSQL service |
| `PAPERCLIP_PUBLIC_URL` | URL do seu deploy no Railway |

---

## Estrutura do Projeto

```
neural-lab-agents/
├── COMPANY.md                    # Missão, visão e valores
├── AGENTS.md                     # Definição dos 5 agentes
├── .paperclip.yaml               # Configuração do Paperclip
├── .env.example                  # Variáveis de ambiente
├── Dockerfile                    # Container para Railway
├── railway.json                  # Config de deploy Railway
│
├── shared/                       # Banco de contexto compartilhado
│   ├── brand_guidelines.md       # Estética Editorial Premium (off-white + roxo)
│   ├── pricing_matrix.md         # Tabela de preços base
│   ├── target_audience.md        # Personas e ICP
│   ├── competitors.md            # Concorrentes monitorados
│   ├── market_data.json          # Dados atualizados pelo Market Intel
│   └── content_calendar.json     # Calendário editorial ativo
│
├── agents/                       # Instructions de cada agente
│   ├── ceo/instructions.md
│   ├── market-intel/instructions.md
│   ├── marketing/instructions.md
│   ├── social/instructions.md
│   └── pricing/instructions.md
│
└── skills/                       # Automações reutilizáveis
    ├── daily-market-report/
    ├── weekly-content-calendar/
    └── proposal-generator/
```

---

## Como Acionar os Agentes

### Relatório de Mercado (automático)
Acontece diariamente às 07:00. Para acionar manualmente:
Criar issue: `📈 Relatório de Mercado — MANUAL` e assignar ao Market Intel Agent.

### Calendário Editorial (automático)
Acontece toda segunda às 08:00 (marketing) e 10:00 (social).
Para acionar manualmente: criar issue com título `Marketing Week — MANUAL`.

### Proposta Comercial (on-demand)
Criar issue com título `Briefing: [Cliente] — [Projeto]` e tag `[BRIEFING]`.
O Pricing Agent gera a proposta em < 2h.

---

## Fases de Implementação

- [x] **Fase 0** — Estrutura base e arquivos de configuração
- [ ] **Fase 1** — Deploy no Railway + agentes ativos + DALL-E 3 gerando imagens reais
- [ ] **Fase 2** — Automações externas (n8n, Telegram, Notion)
- [ ] **Fase 3** — Feedback loop + métricas de performance de conteúdo
- [ ] **Fase 4** — Modelos de imagem abertos (Flux via Replicate) se DALL-E não atender

---

## Custo Estimado Mensal

| Serviço | Plano | Custo |
|---|---|---|
| Railway (servidor) | Hobby/Pro | $5–20 |
| Railway (PostgreSQL) | Managed | $5 |
| Anthropic API (Claude) | Pay per use | $20–80 |
| OpenAI API (DALL-E 3) | Pay per use | ~$15–40 (300–500 imagens) |
| SerpAPI | Developer | $75 |
| **Total estimado** | | **~$120–220/mês** |

> DALL-E 3 HD custa ~$0.08/imagem. Para ~300 imagens/mês (calendário + extras): ~$24.

---

## Tecnologias

- **Orquestração:** [Paperclip](https://github.com/paperclipai/paperclip)
- **LLM principal:** Claude Opus 4.7 (CEO) + Claude Sonnet 4.6 (especialistas) — Anthropic API
- **Geração de imagens:** DALL-E 3 — OpenAI API (ativo desde Fase 1)
- **Infra:** Railway (Node.js + PostgreSQL)
- **Search:** SerpAPI / Serper.dev
- **Automação:** n8n / Make.com (Fase 2)

---

*Neural Lab — Crie ativos com IA. Automatize. Escale.*
