# Skill: Proposal Generator

## Metadata

```yaml
name: proposal-generator
version: "1.0"
description: Gera proposta comercial premium a partir de briefing de cliente
trigger: on-demand
triggerConditions:
  - issue.tags contains "[BRIEFING]"
  - issue.title contains "Briefing:"
  - issue.title contains "Orçamento:"
assignTo: "Pricing & Proposals Agent"
tags: [PROPOSTA, COMERCIAL, CLIENTE]
```

## Description

Esta skill é acionada sempre que um briefing de cliente é registrado.
O Pricing Agent analisa o briefing e gera uma proposta em 3 planos
dentro de 2 horas.

## Como Acionar Esta Skill

### Opção 1 — Via Issue (Recomendado)

Criar uma issue no Paperclip com:
- **Título:** `Briefing: [Nome do Cliente] — [Tipo de Projeto]`
- **Tags:** `[BRIEFING]`
- **Body:** preencher o template abaixo

### Opção 2 — Via Webhook (Automação)

Configurar n8n/Make para criar a issue automaticamente quando:
- Formulário de contato do site é preenchido
- WhatsApp recebe mensagem com palavra "orçamento"
- Email recebido com assunto "orçamento" ou "proposta"

---

## Template de Briefing

```markdown
# Briefing — [NOME DO CLIENTE/EMPRESA]

## Dados do Cliente
- **Nome/Empresa:** 
- **Segmento:** 
- **Contato:** (email ou WhatsApp)
- **Como chegou até o Neural Lab:** (indicação / Instagram / LinkedIn / outro)

## O Projeto

### O que precisa ser feito?
[Descrever o projeto da forma mais detalhada possível]

### Qual é o objetivo principal?
[O que o cliente quer alcançar com este projeto?]

### Quem é o público-alvo?
[Para quem o projeto é feito — cliente final do cliente]

### Prazo desejado
[Quando precisa estar pronto?]

## Referências (se houver)
- [Link ou descrição de referência 1]
- [Link ou descrição de referência 2]

## Assets Disponíveis
- [ ] Logo
- [ ] Fotos/imagens
- [ ] Textos prontos
- [ ] Paleta de cores definida
- [ ] Domínio registrado
- [ ] Hospedagem já tem

## Budget
[Se o cliente mencionou algum valor, registrar aqui. Caso contrário, deixar em branco.]

## Observações Adicionais
[Qualquer informação relevante que não se encaixa acima]
```

---

## Fluxo de Execução

```
1. Issue com tag [BRIEFING] é criada
   ↓
2. Pricing Agent é acionado (heartbeat triggered)
   ↓
3. Agente lê o briefing completo
   ↓
4. Se informações suficientes → gerar proposta (< 2h)
   Se faltam informações → listar perguntas no comentário
   ↓
5. Proposta postada como comentário no issue
   Tags adicionadas: [PROPOSTA GERADA]
   ↓
6. CEO Agent notificado: @CEO — Proposta para [CLIENTE] pronta para revisão
   ↓
7. CEO valida e aprova (ou solicita ajustes)
   ↓
8. Issue recebe tag [APROVADO]
   ↓
9. Humano envia a proposta ao cliente
```

---

## SLA (Tempo de Resposta)

| Situação | Tempo |
|---|---|
| Briefing completo recebido | Proposta em até 2h |
| Briefing incompleto | Perguntas respondidas em 30min, proposta em 2h após respostas |
| Proposta acima de R$10k | + revisão humana (prazo estendido conforme disponibilidade) |
| Urgência confirmada pelo CEO | Prioridade máxima, < 1h |

---

## Outputs Esperados

1. **Comentário na issue** com proposta completa em markdown
2. **Tags:** `[PROPOSTA GERADA]` + `[AGUARDA APROVAÇÃO CEO]`
3. **@mention** ao CEO Agent para validação
4. Se > R$10k: tag `[REQUER APROVAÇÃO HUMANA]` adicionada

## Integração com n8n/Make (Fase 2)

Configurar automação:
- **Trigger:** issue com tag `[APROVADO]` + tag `[PROPOSTA]`
- **Ação:** gerar PDF da proposta via API
- **Ação:** enviar PDF para email do cliente via Gmail API
- **Ação:** notificar no Telegram: "Proposta enviada para [cliente]"
