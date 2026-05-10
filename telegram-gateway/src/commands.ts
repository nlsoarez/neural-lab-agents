/**
 * Command parser — maps Telegram messages to Paperclip issue templates.
 */

export interface ParsedCommand {
  type: 'command' | 'freetext' | 'help'
  agent: string
  labels: string[]
  title: string
  body: string
}

interface CommandDef {
  agent: string
  labels: string[]
  titleFn: (args: string) => string
  bodyFn: (args: string) => string
  description: string
}

const COMMANDS: Record<string, CommandDef> = {
  '/relatorio': {
    agent: 'Market Intel Agent',
    labels: ['RELATORIO', 'TELEGRAM'],
    titleFn: () => {
      const date = new Date().toLocaleDateString('pt-BR')
      return `📈 Relatório de Mercado — ${date} [via Telegram]`
    },
    bodyFn: () => `## Solicitação via Telegram

Execute a rotina completa de análise de mercado conforme suas instruções.

### Checklist
- [ ] Top 3 tendências de IA nas últimas 24h
- [ ] Movimentos de concorrentes
- [ ] 1 oportunidade de conteúdo
- [ ] 1 oportunidade de produto/serviço
- [ ] Atualizar shared/market_data.json

**Responder neste issue com o relatório completo.**`,
    description: '📈 Solicita relatório de mercado do dia',
  },

  '/proposta': {
    agent: 'Pricing & Proposals Agent',
    labels: ['BRIEFING', 'TELEGRAM'],
    titleFn: (args: string) => {
      const clientInfo = args.trim() || 'Cliente não especificado'
      return `💼 Briefing: ${clientInfo} [via Telegram]`
    },
    bodyFn: (args: string) => {
      const parts = args.trim().split(/\s+/)
      const client = parts[0] || 'N/A'
      const details = parts.slice(1).join(' ') || 'Sem detalhes adicionais'
      return `## Briefing via Telegram

**Cliente:** ${client}
**Detalhes:** ${details}

### Instruções
1. Consultar shared/pricing_matrix.md para tiers e valores
2. Gerar proposta estruturada conforme instructions.md
3. Responder neste issue com a proposta completa

**Tags:** [BRIEFING]`
    },
    description: '💼 Gera proposta — uso: /proposta <cliente> <detalhes>',
  },

  '/calendario': {
    agent: 'Social Media & Design Agent',
    labels: ['CALENDARIO', 'TELEGRAM'],
    titleFn: () => {
      const week = getWeekNumber()
      const year = new Date().getFullYear()
      return `📅 Content Calendar — W${week}/${year} [via Telegram]`
    },
    bodyFn: () => `## Solicitação via Telegram

Gerar calendário editorial da semana conforme instruções.

### Checklist
- [ ] Buscar contexto do Marketing Week atual
- [ ] Buscar último relatório Market Intel
- [ ] Criar calendário para 5 dias úteis (Instagram + TikTok)
- [ ] Gerar até 3 imagens via gpt-image-2
- [ ] Enviar imagens via Telegram
- [ ] Publicar no Notion

**Seguir exatamente as instruções do agents/social/instructions.md**`,
    description: '📅 Solicita calendário editorial da semana',
  },

  '/status': {
    agent: 'CEO Agent',
    labels: ['STATUS', 'TELEGRAM'],
    titleFn: () => {
      const date = new Date().toLocaleDateString('pt-BR')
      return `📊 Status Report — ${date} [via Telegram]`
    },
    bodyFn: () => `## Solicitação de Status via Telegram

Gerar relatório de status de todos os agentes.

### Incluir
- Estado atual de cada agente (working/idle/sleeping/error)
- Última entrega de cada agente (com timestamp)
- Issues abertas pendentes
- Custos acumulados do dia (se disponível)
- Alertas ou bloqueios ativos

**Formato conciso — será enviado via Telegram.**`,
    description: '📊 Status de todos os agentes',
  },

  '/custo': {
    agent: 'CEO Agent',
    labels: ['CUSTO', 'TELEGRAM'],
    titleFn: () => {
      const date = new Date().toLocaleDateString('pt-BR')
      return `💰 Custo do Dia — ${date} [via Telegram]`
    },
    bodyFn: () => `## Consulta de Custo via Telegram

Verificar consumo de tokens e custos estimados.

### Incluir
- Tokens consumidos por agente hoje
- Custo estimado por agente (USD)
- Total acumulado do dia
- Comparação com budget diário
- Projeção semanal

**Formato conciso para Telegram.**`,
    description: '💰 Custo acumulado do dia',
  },
}

const HELP_TEXT = [
  '<b>Neural Lab - Comandos Telegram</b>',
  '',
  '<code>/relatorio</code> - Solicita relatorio de mercado do dia',
  '<code>/proposta</code> - Gera proposta (uso: /proposta cliente detalhes)',
  '<code>/calendario</code> - Solicita calendario editorial da semana',
  '<code>/status</code> - Status de todos os agentes',
  '<code>/custo</code> - Custo acumulado do dia',
  '',
  '<b>Texto livre</b> - Envie qualquer mensagem e o CEO Agent interpreta e delega.',
  '',
  'Exemplos:',
  '- "cria uma proposta pra e-commerce, budget 5k"',
  '- "como estao os agentes hoje?"',
  '- "preciso de 3 posts sobre IA para essa semana"',
].join('\n')

/**
 * Parse a Telegram message into a command structure.
 */
export function parseCommand(text: string): ParsedCommand {
  const trimmed = text.trim()

  // Check /help
  if (trimmed === '/help' || trimmed === '/start') {
    return {
      type: 'help',
      agent: '',
      labels: [],
      title: '',
      body: HELP_TEXT,
    }
  }

  // Check known commands
  const parts = trimmed.split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1).join(' ')

  if (COMMANDS[cmd]) {
    const def = COMMANDS[cmd]
    return {
      type: 'command',
      agent: def.agent,
      labels: def.labels,
      title: def.titleFn(args),
      body: def.bodyFn(args),
    }
  }

  // Fallback: free text → CEO Agent
  return {
    type: 'freetext',
    agent: 'CEO Agent',
    labels: ['TELEGRAM'],
    title: `💬 Solicitação Telegram: ${trimmed.slice(0, 60)}${trimmed.length > 60 ? '...' : ''}`,
    body: `## Mensagem do Fundador via Telegram

${trimmed}

---

### Instruções para o CEO Agent
1. Interpretar a solicitação acima
2. Identificar o agente correto para executar
3. Se necessário, criar sub-issue delegando a tarefa
4. Responder neste issue com o plano de ação
5. Se for algo que você pode resolver diretamente, resolva

**Origem:** Telegram | **Prioridade:** Alta (solicitação direta do fundador)`,
  }
}

/** Get ISO week number */
function getWeekNumber(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 604800000
  return Math.ceil((diff / oneWeek) + 1)
}

export { HELP_TEXT }
