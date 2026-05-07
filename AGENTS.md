# Neural Lab Agents

This file defines all agents in the Neural Lab organization.
Each agent has a specific role, adapter configuration, and heartbeat schedule.

---

## CEO — Neural Lab Operations Director

**Role:** Orchestrates all agents, prioritizes demands, validates deliveries, generates executive dashboards.

**Adapter:** claude_local
**Model:** claude-opus-4-7
**Effort:** high
**Max Turns Per Run:** 50
**Heartbeat:** `0 9 * * *` (daily at 09:00 BRT)
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

**Adapter:** claude_local
**Model:** claude-sonnet-4-6
**Effort:** high
**Max Turns Per Run:** 30
**Heartbeat:** `0 7 * * *` (daily at 07:00 BRT)
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

**Adapter:** claude_local
**Model:** claude-sonnet-4-6
**Effort:** high
**Max Turns Per Run:** 40
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

**Adapter:** claude_local
**Model:** claude-sonnet-4-6
**Effort:** medium
**Max Turns Per Run:** 35
**Heartbeat:** `0 10 * * 1` (every Monday at 10:00 BRT)
**Instructions:** agents/social/instructions.md

**Responsibilities:**
- Generate 7-day editorial calendar
- Create Midjourney/Flux/DALL-E image generation prompts
- Write captions for Instagram, LinkedIn, TikTok, YouTube
- Generate Reels/TikTok hooks (first 3 seconds)
- Update shared/content_calendar.json

---

## Pricing & Proposals Agent

**Role:** Analyzes client briefings and generates intelligent quotes and commercial proposals.

**Adapter:** claude_local
**Model:** claude-sonnet-4-6
**Effort:** high
**Max Turns Per Run:** 25
**Heartbeat:** triggered (on-demand via @mention or issue tag [BRIEFING])
**Instructions:** agents/pricing/instructions.md

**Responsibilities:**
- Analyze project briefings
- Calculate hours, complexity, and strategic margin
- Generate 3-tier proposals (basic, standard, premium)
- Produce structured commercial proposals in markdown
- Notify CEO Agent when proposal is ready for review
