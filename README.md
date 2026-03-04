# OGI — Open Geopolitical Intelligence

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/kyronsatt/open-geopolitical-intelligence?style=social)](https://github.com/kyronsatt/open-geopolitical-intelligence)

**Intelligence should be public.**

[What is OGI?](#what-is-ogi) • [Current State](#current-state-poc) • [Quick Start](#quick-start) • [Roadmap](#roadmap) • [Contributing](#contributing)

</div>

---

## What is OGI?

Governments classify it. Institutions gatekeep it. The public rarely gets it.

**Geopolitical intelligence** — the kind that explains not just _what_ is happening, but _why_, _how_, and _what comes next_ — has historically belonged to a small class of analysts, advisors, and institutions. Everyone else gets the news: the surface, stripped of causality, stripped of structure, stripped of the reasoning that makes events actually intelligible.

OGI is an open-source platform built on the belief that this should change.

It combines structured conflict data with AI-powered analysis to produce the kind of layered, multi-perspective intelligence that has until now lived behind classification levels and paywalls — and makes it freely accessible to anyone.

> For the full vision, read the **[OGI Manifest](./MANIFEST.md)**.

---

## Current State: Proof of Concept

**This is an early POC.** It is not yet the platform described in the manifest.

What exists today is a focused demonstration of the architecture and analytical approach, built around a single conflict case study: **USA–Iran**.

### What works right now

- **3D Globe** — interactive globe with conflict arc visualization between actors
- **Conflict Timeline** — structured chronology of key events from 1979 to present
- **AI Briefing** — multi-perspective situation assessment generated via LLM (military posture, economic measures, diplomatic status, internal pressure per actor)
- **Impact Assessment** — six scored systemic metrics with confidence intervals (domestic stability, regional destabilization, economic shock, energy disruption, alliance stress)
- **Causal Graph** — interactive force-directed graph modeling cause-effect chains (e.g. Sanctions → Oil exports ↓ → State revenue ↓ → Internal instability ↑)
- **Policy Pathways** — three realistic scenario explorations with probability estimates, required actions, and systemic side effects
- **Versioned Analysis Snapshots** — each time a new timeline event is added, a full new analysis is generated and stored; historical snapshots are browsable

### What does not exist yet

- **No real-time data ingestion** — conflict data and context are currently seeded manually. There is no live pipeline from ACLED, UCDP, news sources, or economic APIs.
- **No automated event detection** — new events are added manually by the maintainer via an admin endpoint.
- **Single conflict only** — the platform currently models USA–Iran exclusively. Multi-conflict support is on the roadmap.
- **No community features** — voting, crowdsourced risk perception, and public pressure dashboards are not yet built.
- **No backtesting** — historical conflict modeling and accuracy validation are not yet implemented.
- **Context is static** — the factual context injected into AI prompts is hardcoded, not dynamically retrieved.

### How analysis is currently generated

Analysis is triggered manually. When a significant event occurs, the maintainer calls a Supabase Edge Function via curl, passing the event details. The function inserts the event into the timeline and runs four parallel LLM chains (via LangChain + OpenRouter) to generate a full analysis snapshot: briefing, impact assessment, causal graph, and policy pathways. The snapshot is stored in Supabase and served to the frontend.

There is no automation. This is intentional for the POC — it keeps the system simple, auditable, and free of hallucination drift from unreviewed auto-ingestion.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenRouter account (free tier works)

### Installation

```bash
git clone https://github.com/kyronsatt/open-geopolitical-intelligence.git
cd open-geopolitical-intelligence
npm install
cp .env.example .env
# Add your Supabase and OpenRouter credentials to .env
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For the Edge Function (set in Supabase dashboard secrets):

```
OPENROUTER_API_KEY=your_openrouter_key
ADMIN_SECRET=your_chosen_secret
```

### Run

```bash
npm run dev
# Open http://localhost:8080
```

### Trigger Analysis (Admin)

When a new event occurs, add it and regenerate analysis:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/trigger-analysis \
  -H "x-admin-key: YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "conflict_id": "YOUR_CONFLICT_UUID",
    "date": "2025-03-04",
    "title": "Event title",
    "description": "What happened and why it matters.",
    "category": "military",
    "significance": "high",
    "sources": ["Reuters", "AP"]
  }'
```

---

## Project Structure

```
open-geopolitical-intelligence/
├── public/
├── src/
│   ├── components/
│   │   ├── conflict/       # ConflictHeader, TimelineView
│   │   ├── analysis/       # BriefingPanel, ImpactMetrics, CausalGraph
│   │   ├── simulation/     # PathwayExplorer
│   │   └── ui/             # GlassCard, Badge, MetricBar, skeletons
│   ├── pages/
│   │   ├── HomePage.tsx    # Globe landing
│   │   └── ConflictPage.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── types.ts
│   └── hooks/
├── supabase/
│   └── functions/
│       └── trigger-analysis/   # LangChain + OpenRouter edge function
└── MANIFEST.md                 # The full vision
```

---

## Tech Stack

| Layer            | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| Frontend         | React + TypeScript + Vite                             |
| Styling          | Tailwind CSS + shadcn/ui                              |
| Globe            | react-globe.gl                                        |
| Graph            | D3.js (force-directed)                                |
| Animation        | Framer Motion                                         |
| Database         | Supabase (PostgreSQL)                                 |
| Backend          | Supabase Edge Functions (Deno)                        |
| AI Orchestration | LangChain.js                                          |
| LLM              | OpenRouter — `meta-llama/llama-3.3-70b-instruct:free` |

---

## Roadmap

The POC demonstrates the analytical architecture. What comes next, in rough priority order:

**Near term**

- [ ] Multi-conflict support (globe with multiple active arcs)
- [ ] Live data ingestion from ACLED API
- [ ] News scraping pipeline for automatic event detection
- [ ] Source citations inline in AI briefings

**Medium term**

- [ ] Historical conflict archive with backtesting
- [ ] Economic indicator feeds (World Bank, IMF, EIA)
- [ ] Community pathway voting
- [ ] Public API for researchers

**Long term**

- [ ] Multi-agent negotiation modeling
- [ ] Reinforcement learning policy exploration
- [ ] Academic institution partnerships
- [ ] Reasoning explainability dashboard

---

## Contributing

This project is early and contributions are genuinely needed — not just in code.

**What would help most right now:**

- 🗂 **Data curation** — structured event data for other conflicts
- 🤖 **Prompt engineering** — improving the LLM analysis quality and reducing hallucination
- 🎨 **Design** — UI/UX improvements and mobile experience
- 📖 **Documentation** — methodology write-ups, component docs
- 💻 **Engineering** — data pipeline, multi-conflict architecture, API layer

See [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

---

## A Note on Limitations

OGI's AI analysis is generated by a large language model with access to a static factual context. It is not a real-time intelligence system. It does not have access to classified information. It can hallucinate. It can reflect biases present in its training data.

Every analysis includes a confidence score and sourcing. The methodology is open and challengeable. The goal is structured reasoning, not oracular prediction.

Use it to think more clearly. Not to think for you.

---

## License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">

**OGI** — _Intelligence should be public._

Built by [Kyronsatt](https://kyronsatt.com) · [Read the Manifest](./MANIFEST.md)

</div>
