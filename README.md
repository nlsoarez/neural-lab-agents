# Neural Lab — Sistema Operacional de Agentes IA

> Crie ativos com IA. Automatize. Escale.

Sistema multiagente rodando no Railway via Paperclip, com heartbeats controlados para evitar custo ocioso.
5 agentes especializados orquestrados para automatizar toda a operação do Neural Lab.

---

## Arquitetura

```
CEO (Operations Director)       — GPT-5.4 mini [weekdays 09:00]
├── Market Intel Agent          — GPT-5.4 mini [weekdays 07:00]
├── Marketing & Copy Agent      — GPT-5.4 mini [weekly Mon 08:00]
├── Social Media & Design Agent — GPT-5.4 mini + GPT-Image-2 [weekly Mon 10:00]
└── Pricing & Proposals Agent   — GPT-5.4 mini [on-demand]
```

## O Que o Sistema Faz Automaticamente

| Quando | O Quê |
|---|---|
| Dias úteis às 07:00 | Relatório de mercado + tendências de IA |
| Dias úteis às 09:00 | CEO revisa, delega e gera Ops Summary |
| Segunda 08:00 | Plano de marketing + copy da semana |
| Segunda 10:00 | Calendário editorial de 5 dias + até 3 imagens |
| On-demand | Proposta comercial em < 2h via briefing |

---

## Setup Rápido

### Pré-requisitos
- Conta no [Railway](https://railway.app)
- [OpenAI API Key](https://platform.openai.com/api-keys)
- [Serper.dev](https://serper.dev) ou [SerpAPI](https://serpapi.com) para pesquisa de mercado (opcional, mas recomendado)

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
npx paperclipai company import --from /app/neural-lab-agents
```

### 5. Verificar agentes

Acesse `https://neural-lab.up.railway.app` e verifique:
- [ ] 5 agentes aparecem no org chart
- [ ] Test Environment passa para todos os agentes
- [ ] Heartbeats reativados manualmente após validar adapters e budgets
- [ ] Shared context bank acessível

---

## Variáveis de Ambiente Obrigatórias

| Variável | Onde obter |
|---|---|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
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
Acontece em dias úteis às 07:00. Para acionar manualmente:
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
- [ ] **Fase 1** — Deploy no Railway + agentes ativos + GPT-Image-2 gerando imagens reais
- [ ] **Fase 2** — Automações externas (n8n, Telegram, Notion)
- [ ] **Fase 3** — Feedback loop + métricas de performance de conteúdo
- [ ] **Fase 4** — Modelos de imagem abertos (Flux via Replicate) somente se GPT-Image-2 não atender

---

## Custo Estimado Mensal

| Serviço | Plano | Custo |
|---|---|---|
| Railway (servidor) | Hobby/Pro | $5–20 |
| Railway (PostgreSQL) | Managed | $5 |
| OpenAI texto (GPT-5.4 mini) | Pay per use | ~$10–35 |
| OpenAI imagens (GPT-Image-2) | Pay per use | ~$5–25 |
| Serper.dev ou SerpAPI | opcional | $0–75 |
| **Total estimado sem SerpAPI pago** | | **~$25–85/mês** |
| **Total estimado com SerpAPI Developer** | | **~$100–160/mês** |

> Controle duro de custo deve ser configurado no Paperclip UI/API como budgetMonthlyCents por agente. O YAML reduz modelos, turnos, heartbeats e limite de imagens, mas budget em dólares precisa estar ativo no Paperclip.

---

## Tecnologias

- **Orquestração:** [Paperclip](https://github.com/paperclipai/paperclip)
- **LLM principal:** GPT-5.4 mini via Codex Local — OpenAI API
- **Geração de imagens:** GPT-Image-2 — OpenAI API (modelo fixo do Social Media & Design Agent)
- **Infra:** Railway (Node.js + PostgreSQL)
- **Search:** SerpAPI / Serper.dev
- **Automação:** n8n / Make.com (Fase 2)

---

*Neural Lab — Crie ativos com IA. Automatize. Escale.*
