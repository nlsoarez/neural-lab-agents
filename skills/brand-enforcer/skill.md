# Skill: Brand Enforcer

## Metadata

```yaml
name: brand-enforcer
version: "1.0"
description: Injeta brand guidelines no contexto do agente apenas quando ele gera conteúdo visual ou textual voltado ao público
trigger: on-demand
assignTo: "*"
tags: [BRAND, CONTEUDO, QUALIDADE]
```

## Description

Esta skill é ativada automaticamente quando um agente está prestes a gerar
conteúdo público (posts, relatórios para clientes, propostas comerciais,
newsletters). Ela injeta as diretrizes da marca Neural Lab no contexto,
garantindo consistência sem desperdiçar tokens em tasks internas.

**Quando NÃO ativar:** tasks internas, análise de dados, comunicação entre
agentes, atualizações de JSON, operações CRUD no Notion.

**Quando ativar:** qualquer output que será visto por humanos externos —
posts em redes sociais, relatórios publicados, propostas comerciais,
emails de marketing, landing pages, apresentações.

## Brand Guidelines (Injetadas)

### Identidade Visual

- **Palette primária:** Off-white (#F5F5F5) fundo, Roxo (#6B21A8) accent, Preto (#1A1A1A) texto
- **Palette secundária:** Verde (#22C55E) sucesso, Âmbar (#F59E0B) alerta, Vermelho (#EF4444) erro
- **Tipografia:** Inter (corpo), Space Grotesk (headings), JetBrains Mono (código)
- **Estilo visual:** "Apple keynote editorial" — espaço negativo generoso, hierarquia tipográfica clara, sem ornamentos

### Tom de Voz

- **Personalidade:** Especialista confiante, não arrogante. Curioso, não ingênuo.
- **Registro:** Profissional-casual. Técnico quando necessário, acessível sempre.
- **Pronomes:** "Nós" ao falar da Neural Lab, "Você" ao falar do cliente.
- **Evitar:** Jargão desnecessário, superlativos vazios ("o melhor", "revolucionário"), emojis excessivos.
- **Emojis permitidos:** Máximo 2 por post. Preferir: 🧠 🔬 📊 ⚡ 🎯 💡

### Estrutura de Conteúdo

- **Hook:** Primeira linha deve gerar curiosidade ou valor imediato
- **Corpo:** Máximo 3 parágrafos para LinkedIn, 280 chars para Twitter
- **CTA:** Sutil, orientado a valor ("Quer saber como aplicamos isso? Link na bio")
- **Hashtags:** Máximo 5 para LinkedIn, 3 para Twitter. Sempre incluir: #NeuralLab #IA

### Formatação por Plataforma

| Plataforma | Tamanho | Tom | Formato |
|---|---|---|---|
| LinkedIn | 200-500 palavras | Profissional-educativo | Parágrafos curtos, bullet points |
| Twitter/X | 280 chars | Direto, provocativo | Thread se necessário (max 5 tweets) |
| Blog | 800-1500 palavras | Deep-dive técnico | H2/H3, code blocks, imagens |
| Newsletter | 300-600 palavras | Pessoal, curadoria | Seções: Destaque, Insights, Links |
| Proposta | 2-4 páginas | Formal-consultivo | Seções: Contexto, Solução, Investimento |

## Task Template

Quando esta skill for ativada, injetar o seguinte prompt prefix:

```
[BRAND ENFORCER ATIVO]

Você está gerando conteúdo público para a Neural Lab.
Siga RIGOROSAMENTE as diretrizes abaixo:

1. TOM: Profissional-casual, especialista confiante
2. VISUAL: Off-white + roxo, tipografia Inter/Space Grotesk
3. EMOJI: Máximo 2 por peça, do set aprovado (🧠🔬📊⚡🎯💡)
4. ESTRUTURA: Hook → Corpo conciso → CTA sutil
5. HASHTAGS: Sempre #NeuralLab #IA + máx 3 relevantes
6. EVITAR: Superlativos vazios, jargão, promessas exageradas

Plataforma alvo: [DETECTAR DO CONTEXTO]
Formato esperado: [VER TABELA ACIMA]
```

## Checklist de Conformidade

Antes de entregar qualquer conteúdo público, verificar:

- [ ] Tom alinhado (profissional-casual, sem arrogância)
- [ ] Máximo de emojis respeitado (≤2)
- [ ] Hashtags dentro do limite e incluem #NeuralLab #IA
- [ ] Sem superlativos vazios ou promessas exageradas
- [ ] Estrutura correta para a plataforma alvo
- [ ] CTA presente e sutil
- [ ] Tamanho dentro do range da plataforma

## Outputs Esperados

1. Conteúdo gerado seguindo 100% das diretrizes
2. Se alguma diretriz não puder ser seguida, justificar no comentário do issue
3. Auto-avaliação de conformidade (checklist preenchido) no final do output

## Dependências

- `shared/brand_guidelines.md` (source of truth completa)
- Notion DB `BRAND` via skill `notion-sync` para atualizações dinâmicas

## Escalação

Se o conteúdo gerado falhar em 2+ itens do checklist:
→ Reescrever antes de publicar
→ Se persistir, escalar para CEO Agent com tag `[REVIEW]`
