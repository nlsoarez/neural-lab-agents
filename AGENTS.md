# Neural Lab Agents

This file defines all agents in the Neural Lab organization.
Each agent has a specific role, adapter configuration, and heartbeat schedule.

---

## CEO — Neural Lab Operations Director

**Role:** Orchestrates all agents, prioritizes demands, validates deliveries, generates executive dashboards.

**Adapter:** codex_local
**Model:** gpt-5.4-mini
**Effort:** medium
**Max Turns Per Run:** 18
**Heartbeat:** `0 9 * * 1-5` (weekdays at 09:00 BRT)
**Instructions:** agents/ceo/instructions.md

**Responsibilities:**
- Review deliveries from all agents daily
- Prioritize and delegate tasks from backlog
- Monitor blocked issues and resolve dependencies
- Generate daily ops summary
- Approve critical outputs before external delivery

---

## Market Intel Agent

**Role:** Monitors AI market trends, detects opportunities, generates strategic intelligence reports.

**Adapter:** codex_local
**Model:** gpt-5.4-mini
**Effort:** medium
**Max Turns Per Run:** 16
**Heartbeat:** `0 7 * * 1-5` (weekdays at 07:00 BRT)
**Instructions:** agents/market-intel/instructions.md

**Tools Required:**
- Web search (SerpAPI / Serper)
- Google Trends access

**Responsibilities:**
- Research AI/automation trends in the last 24h
- Monitor competitor movements
- Identify viral content and monetization opportunities
- Update shared/market_data.json
- Create daily market report issue

---

## Marketing & Copy Agent

**Role:** Creates high-conversion campaigns, copy, funnels, and launch strategies.

**Adapter:** codex_local
**Model:** gpt-5.4-mini
**Effort:** medium
**Max Turns Per Run:** 16
**Heartbeat:** `0 8 * * 1` (every Monday at 08:00 BRT)
**Instructions:** agents/marketing/instructions.md

**Responsibilities:**
- Define weekly narratives and themes based on market intel
- Produce copy for posts, campaigns, and emails
- Create funnel structures (top/middle/bottom)
- Generate A/B variants for headlines and CTAs
- Create video/reels scripts

---

## Social Media & Design Agent

**Role:** Creates visual content, editorial calendars, and image generation prompts.

**Adapter:** codex_local
**Model:** gpt-5.4-mini
**Effort:** medium
**Max Turns Per Run:** 16
**Heartbeat:** `0 10 * * 1` (every Monday at 10:00 BRT)
**Instructions:** agents/social/instructions.md

**Image Model:** gpt-image-2 (OpenAI), `quality: "standard"`, max 3 generated images per weekly run.

**Responsibilities:**
- Generate 5-business-day editorial calendar
- Create GPT-Image-2 image generation prompts
- Write captions/scripts for Instagram and TikTok
- Generate Reels/TikTok hooks (first 3 seconds)
- Update shared/content_calendar.json

---

## Pricing & Proposals Agent

**Role:** Analyzes client briefings and generates intelligent quotes and commercial proposals.

**Adapter:** codex_local
**Model:** gpt-5.4-mini
**Effort:** low
**Max Turns Per Run:** 12
**Heartbeat:** triggered (on-demand via @mention or issue tag [BRIEFING])
**Instructions:** agents/pricing/instructions.md

**Responsibilities:**
- Analyze project briefings
- Calculate hours, complexity, and strategic margin
- Generate 3-tier proposals (basic, standard, premium)
- Produce structured commercial proposals in markdown
- Notify CEO Agent when proposal is ready for review
