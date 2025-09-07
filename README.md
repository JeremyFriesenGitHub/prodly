<div align="center">

# Prodly

Smart focus + spending companion. Plan your day, track tasks, run a Pomodoro loop, and get lightweight expense insights — all in one fast, dark‑mode ready Next.js app.


</div>

## ✨ Core Modules

| Module | What It Does | SAM Assist |
|--------|--------------|--------------------------------|
| Pomodoro | Classic timer with focus / short / long cycles | — |
| Tasks | Create, tag, prioritize, auto‑plan your day |  Scheduling logic  |
| Expenses | Quick logging, category + month summaries, CSV import/export | Suggestion engine (envelopes + habit nudges) |
| Theme | Persistent light/dark with instant, flicker‑free hydration | — |

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

## 🤖 SAM / Agent Backend

If you deploy a Solace Agent Mesh service, set these env vars:

| Variable | Purpose | Default |
|----------|---------|---------|
| `SAM_URL` | Base URL to agent message endpoint | `http://localhost:8000` |
| `SAM_AGENT_NAME` | Target agent name | `OrchestratorAgent` |
| `SAM_NAMESPACE` | Agent namespace | `default_namespace` |

Static export will ignore those (route executes nowhere).

## 🧩 Extending Actions

Add a new action:
1. Define a type constant you’ll send from the client (e.g. `habit.summarize`).
2. Implement server branch in `api/mesh/route.ts` (with local fallback).
3. Mirror a deterministic client implementation in `mesh-local.ts` for static/offline.
4. Call it from a page with the same try → catch → fallback pattern.


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
* Backend to save data better (login + accounts page)
* End-to-end Encryption to better secure data being processed
* Calendar export for planned task blocks
* Light analytics panel snapshot (weekly diff, burn rate)

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