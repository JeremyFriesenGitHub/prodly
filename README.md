<div align="center">

# Prodly

Smart focus + spending companion. Plan your day, track tasks, run a Pomodoro loop, and get lightweight expense insights — all in one fast, dark‑mode ready Next.js app.

![UI Banner](public/next.svg)

</div>

## ✨ Core Modules

| Module | What It Does | Smart Assist (Local Fallback) |
|--------|--------------|--------------------------------|
| Pomodoro | Classic timer with focus / short / long cycles | — |
| Tasks | Create, tag, prioritize, auto‑plan your day | Local scheduling logic if the API agent is unavailable |
| Expenses | Quick logging, category + month summaries, CSV import/export | Local suggestion engine (envelopes + habit nudges) |
| Theme | Persistent light/dark with instant, flicker‑free hydration | — |

## 🧠 “Mesh” Fallback Architecture
The app calls a unified endpoint (`/api/mesh`) for enrichment actions: `expense.advise`, `tasks.plan`, and event forwarding (e.g. `expense.add`).

Because GitHub Pages is a static host, API routes won’t run there. To keep the UX rich:

1. UI attempts a POST to `/api/mesh`.
2. If it fails (or you're on a static export), the page falls back to pure client logic from `src/lib/mesh-local.ts`.
3. Results share the same shape as the server response.

You can later deploy a real agent/SAM backend (Solace Agent Mesh) without changing page code.

## 🗂 Directory Glance

```
src/app/
	page.tsx           # Landing / marketing surface
	pomodoro/          # Pomodoro UI
	tasks/             # Tasks page with planner
	expenses/          # Expenses tracker + insights
	api/mesh/route.ts  # Unified action endpoint (inactive on static hosting)
src/lib/mesh-local.ts# Client fallback logic (planning + expense advising)
```

## 🚀 Quick Start (Dev)

```bash
git clone <this-repo>
cd hack
npm install
npm run dev
```
Open http://localhost:3000.

## 🧪 Type & Lint Discipline
ESLint + TypeScript strictness enforced (no `any`).
If adding new feature logic, export small typed result objects (mirroring how `ExpenseAdviceResult` / `PlanTasksResult` work).

## 🤖 Optional SAM / Agent Backend

If you deploy a Solace Agent Mesh service, set these env vars (in a real runtime host — not GitHub Pages):

| Variable | Purpose | Default |
|----------|---------|---------|
| `SAM_URL` | Base URL to agent message endpoint | `http://localhost:8000` |
| `SAM_AGENT_NAME` | Target agent name | `OrchestratorAgent` |
| `SAM_NAMESPACE` | Agent namespace | `default_namespace` |

Static export will ignore those (route executes nowhere). Frontend simply falls back locally.

## 🧩 Extending Actions

Add a new action:
1. Define a type constant you’ll send from the client (e.g. `habit.summarize`).
2. Implement server branch in `api/mesh/route.ts` (with local fallback).
3. Mirror a deterministic client implementation in `mesh-local.ts` for static/offline.
4. Call it from a page with the same try → catch → fallback pattern.

## 📊 Expense Advice Model (Local)
Heuristics used:
* Category concentration (>40% flag)
* Month-over-month change (≥20%)
* Subscription / Gym / Annual pattern detection by keyword
* Merchant frequency clustering (≥3 occurrences)
* Top-category envelope sizing (weeklyCap heuristic)

Outputs: `suggestions[]`, `envelopes[]`, `stats{ total, topCategories[], months[] }`, `narrative`.

## 🗓 Task Planner (Local)
Scoring factors:
* Overdue > Due today > Priority (high/med/low)
* Blocked penalty
* Light jitter for tie‑breaking
Generates a sequential block schedule starting “now,” with small buffers.

## 🎨 Theming
Immediate, flicker‑free theme load via inline script in `layout.tsx` applying saved preference before React hydration.

## 🛠 Tech Stack
* Next.js App Router
* TypeScript + ESLint (strict)
* TailwindCSS
* Deterministic utility RNG for reproducible advice (seeded xorshift32 variant)

## 📦 Static Deployment Notes
GitHub Pages workflow (`.github/workflows/nextjs.yml`) performs `next build` + `next export` producing `out/`.
API routes don’t execute there; ensure any critical feature has a client fallback.

## 🔍 Roadmap Ideas
* Calendar export for planned task blocks
* Editable block durations (drag to resize)
* Category rename + merge tool in expenses
* Light analytics panel snapshot (weekly diff, burn rate)
* Real SAM agent integration (LLM-driven refinement)

## 🤝 Contributing
Small, focused PRs welcome. Suggested flow:
1. Create a branch
2. Add/update types & tests (if logic)
3. Run lint + build
4. Open PR with a concise summary

```bash
npm run lint
npm run build
```

## 🐛 Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Fallback always used | Static export / no server runtime | Deploy to Vercel/Netlify or keep fallback | 
| SAM errors in console | Backend unreachable | Confirm `SAM_URL` & CORS | 
| Dark mode flashes | Local storage missing early | Ensure inline theme script intact |

## 📄 License
MIT – use, remix, adapt.

---
Built to explore a tight feedback loop between planning, focus, and spending habits.