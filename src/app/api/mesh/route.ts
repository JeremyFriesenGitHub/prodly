// app/api/mesh/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// (Removed unused top-level DEFAULT_MAX_SUGGESTIONS; a scoped one exists where needed)


type Expense = {
  id: string;
  date: string;          // ISO yyyy-mm-dd
  category: string;
  description: string;
  amount: number;
};
type Task = {
  id: string;
  title: string;
  notes: string;
  priority: "low" | "medium" | "high";
  due?: string;          // ISO yyyy-mm-dd
  tags: string[];
  completed: boolean;
  createdAt: number;
  completedAt?: number;
};

const SAM_URL = process.env.SAM_URL || "http://localhost:8000";
const SAM_AGENT = process.env.SAM_AGENT_NAME || "OrchestratorAgent";
const SAM_NAMESPACE = process.env.SAM_NAMESPACE || "default_namespace";

// ---------- helpers ----------
function uuid(): string {
  try {
    if (typeof globalThis !== "undefined") {
      const g = globalThis as { crypto?: { randomUUID?: () => string } };
      if (typeof g.crypto?.randomUUID === "function") {
        return g.crypto.randomUUID();
      }
    }
  } catch { /* noop */ }
  return Math.random().toString(36).slice(2);
}

function choose<T>(arr: T[], rng = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(arr: T[], rng = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function maybe(p: number, rng = Math.random) {
  return rng() < p;
}

function minsToHHMM(total: number) {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// (Removed unused pctDelta & mean helpers)

// optional deterministic RNG if caller sends a seed
function seeded(seed: number) {
  // xorshift32
  let x = seed || 123456789;
  return function () {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 1_000_000) / 1_000_000;
  };
}

// ---------- SAM forwarder ----------
type SamPayload = unknown; // widen later when backend contract stabilizes
type SamJSON = Record<string, unknown>;

async function sendToSam(type: string, payload: SamPayload): Promise<SamJSON | { raw: string }> {
  const endpoint = new URL("/api/v1/message:send", SAM_URL).toString(); // keep ':' intact

  const body = {
    jsonrpc: "2.0",
    id: uuid(),
    method: "message/send",
    params: {
      to: { name: SAM_AGENT, namespace: SAM_NAMESPACE },
      message: {
        messageId: uuid(),
        role: "user",
        metadata: {
          agent_name: SAM_AGENT,
          namespace: SAM_NAMESPACE,
          parallel_tool_calls: false, // belt-and-suspenders against OpenAI-style param
          intent: type,
        },
        parts: [
          { text: `intent:${type}` },
          { text: `payload:${JSON.stringify(payload)}` },
        ],
      },
    },
  };

  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await r.text();
  let data: SamJSON | { raw: string };
  try {
    data = JSON.parse(text) as SamJSON;
  } catch {
    data = { raw: text };
  }

  if (!r.ok) {
    throw new Error(`SAM ${r.status}: ${text || r.statusText}`);
  }
  return data;
}

// (Removed large unused advice constant arrays to satisfy lint; reintroduce when integrated.)

// ---------- route ----------
export async function POST(req: Request) {
  const { type, payload } = await req.json();
  const seed = Number(payload?.seed ?? 0);
  const rng = seed ? seeded(seed) : Math.random;

  // Try SAM first
  try {
    const samResp = await sendToSam(type, payload);
    return NextResponse.json(samResp);
  } catch (e) {
    console.warn("[/api/mesh] SAM forward failed:", (e as Error).message);
  }

  // ---- Local fallbacks so UI still works if SAM is down ----
  if (type === "expense.advise") {
    const items: Expense[] = payload?.items ?? [];
    const currency = payload?.currency || "CAD";
    const DEFAULT_MAX_SUGGESTIONS = Number(process.env.EXPENSE_MAX_SUGGESTIONS || 6);
    const maxSuggestions = Math.max(3, Math.min(10, Number(payload?.maxSuggestions ?? DEFAULT_MAX_SUGGESTIONS)));
  
    // tiny seeded RNG (optional; keeps phrasing a bit fresh but deterministic with payload.seed)
    const makeRng = (seed: number) => {
      let t = seed >>> 0;
      return () => ((t = (t * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    };
    const rng = Number.isFinite(+payload?.seed) ? makeRng(+payload.seed) : Math.random;
    const choose = (arr: string[]) => arr[Math.floor(rng() * arr.length)];
  
    const byCategory = new Map<string, number>();
    const byMonth = new Map<string, number>();
    const byMerchant = new Map<string, { count: number; total: number }>();
  
    for (const e of items) {
      const amt = Number(e.amount) || 0;
      byCategory.set(e.category, (byCategory.get(e.category) || 0) + amt);
      const ym = e.date?.slice(0, 7);
      if (ym) byMonth.set(ym, (byMonth.get(ym) || 0) + amt);
  
      const merchantKey = (e.description || "").trim().toLowerCase();
      if (merchantKey) {
        const prev = byMerchant.get(merchantKey) || { count: 0, total: 0 };
        prev.count += 1;
        prev.total += amt;
        byMerchant.set(merchantKey, prev);
      }
    }
  
    const total = [...byCategory.values()].reduce((a, b) => a + b, 0);
    const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const last = months.at(-1)?.[1] ?? 0;
    const prev = months.at(-2)?.[1] ?? 0;
    const topCats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { style: "currency", currency, maximumFractionDigits: 2 });
  
    // No data → gentle nudge only
    if (items.length === 0) {
      return NextResponse.json({
        suggestions: ["Add a few expenses so I can spot real trends and propose targeted caps."],
        envelopes: [],
        stats: { total: 0, topCategories: [], months: [] },
        narrative: "Once you add some data, I’ll flip into analysis mode.",
      });
    }
  
    // --- Relevance signals ---
    const dominant40 = total > 0 && [...byCategory.values()].some(v => v / total > 0.4);
    const hasOther = byCategory.has("Other");
    const otherShare = hasOther ? (byCategory.get("Other")! / Math.max(total, 1)) : 0;
  
    const SUB_KEYS = ["sub", "subscription", "spotify", "netflix", "prime", "youtube", "icloud", "onedrive", "adobe", "canva", "membership"];
    const GYM_KEYS = ["gym", "fitness", "classpass"];
    const ANNUAL_KEYS = ["insurance", "domain", "license", "registration", "tax", "tuition", "membership", "annual"];
  
    const hasSubscription = items.some(i => {
      const d = (i.description || "").toLowerCase();
      return SUB_KEYS.some(k => d.includes(k));
    });
  
    const hasGym = items.some(i => {
      const d = (i.description || "").toLowerCase();
      return GYM_KEYS.some(k => d.includes(k));
    });
  
    const hasAnnualish = items.some(i => {
      const d = (i.description || "").toLowerCase();
      return ANNUAL_KEYS.some(k => d.includes(k));
    });
  
    const repeatedMerchant = [...byMerchant.entries()]
      .map(([m, v]) => ({ merchant: m, ...v }))
      .filter(x => x.count >= 3 && x.total >= 50)
      .sort((a, b) => b.total - a.total)[0];
  
    const bigMoMChange = months.length >= 2 && Math.abs(last - prev) / Math.max(prev, 1) >= 0.2; // 20%+
  
    // Category-targeted suggestion bank (picked ONLY if that category is present)
    const CAT_TIPS: Record<string, string[]> = {
      Groceries: [
        "Groceries: plan 3 core meals, shop your list, and anchor around store-brand staples.",
        "Groceries: buy base items in bulk (rice, beans, oats) and let meals orbit them.",
      ],
      "Food & Dining": [
        "Food & Dining: swap one dining-out this week for a home cook; bank the difference.",
        "Food & Dining: set a per-outing cap and pre-decide the number of outings.",
      ],
      Restaurants: [
        "Restaurants: pick one ‘treat night’ and keep the rest to home meals.",
        "Restaurants: default to water; sides add up quickly.",
      ],
      Transport: [
        "Transport: batch errands into one trip; fewer cold starts saves real fuel.",
        "Transport: map the week—stack nearby stops to cut cross-town backtracking.",
      ],
      Fuel: [
        "Fuel: keep tires properly inflated; it’s a quiet efficiency gain.",
        "Fuel: combine short trips; cold engines burn more.",
      ],
      Gas: [
        "Gas: group short drives; quick hops are the least efficient.",
        "Gas: check tire pressure; small PSI gaps cost over a month.",
      ],
      Travel: [
        "Travel: price alerts + flexible dates usually beat fixed-date searches.",
        "Travel: pack snacks/water to avoid high airport/road markups.",
      ],
      Shopping: [
        "Shopping: 24-hour cooldown → wishlist first, cart later.",
        "Shopping: filter by ‘needs’ only this month; wants go to next month’s list.",
      ],
      Utilities: [
        "Utilities: compare current plan vs. new-customer promos; ask for a retention match.",
        "Utilities: auto-read your usage; set alerts for spikes.",
      ],
      Entertainment: [
        "Entertainment: rotate one streamer per month; ‘one-in-one-out’ keeps costs sane.",
        "Entertainment: library/app bundles can replace single-purpose subs.",
      ],
      Health: [
        "Health: ask providers about cash-pay or preventative bundle discounts.",
        "Health: schedule routine care in one window to avoid extra trips.",
      ],
      Gym: [
        "Gym: check pause/reduced-rate options for 1–2 months while you reassess.",
        "Gym: if usage < 6 visits/month, pay-per-visit might be cheaper.",
      ],
      Other: [
        "Other: rename ‘Other’ items into specific buckets; precision changes behavior.",
      ],
    };
  
    // Map loose category names (case-insensitive) to our bank keys
    const normalizeCat = (c: string) => {
      const s = (c || "").toLowerCase();
      if (/grocery|grocer|supermarket/.test(s)) return "Groceries";
      if (/food|dining|eat|cafe|coffee|restaurant/.test(s)) return "Food & Dining";
      if (/restaurant/.test(s)) return "Restaurants";
      if (/transport|transit|uber|lyft|taxi/.test(s)) return "Transport";
      if (/fuel|gasoline|diesel/.test(s)) return "Fuel";
      if (/gas\b/.test(s)) return "Gas";
      if (/travel|flight|hotel|airbnb/.test(s)) return "Travel";
      if (/shop|retail|apparel|clothes|electronics/.test(s)) return "Shopping";
      if (/utility|internet|wifi|electric|power|water|gas bill/.test(s)) return "Utilities";
      if (/entertainment|movies|music|games/.test(s)) return "Entertainment";
      if (/health|pharmacy|doctor|dentist/.test(s)) return "Health";
      if (/gym|fitness/.test(s)) return "Gym";
      if (/other|misc/.test(s)) return "Other";
      return c || "Other";
    };
  
    const curated: string[] = [];
  
    // 1) Snapshot (always relevant)
    curated.push(
      choose(["Quick snapshot:", "Here’s the short read:", "Fast overview:"]),
      `You’ve logged ${fmt(total)}${
        months.length ? `; last month ${fmt(prev)}, this month ${fmt(last)}` : ""
      }.`
    );
  
    // 2) Top category statement (relevant by definition)
    if (topCats[0]) {
      const [cat, val] = topCats[0];
      curated.push(`${choose(["Top category", "Largest bucket", "Biggest driver"])}: ${cat} at ${fmt(val)}.`);
    }
  
    // 3) Category-specific tips only for categories that actually appear (up to 2)
    for (const [rawCat] of topCats.slice(0, 2)) {
      const key = normalizeCat(rawCat);
      if (CAT_TIPS[key]?.length) curated.push(choose(CAT_TIPS[key]));
    }
  
    // 4) Only-if-true relevance checks
    if (dominant40) {
      curated.push("Alert: one category is >40% of spend — add a weekly cap + split rules.");
    }
  
    if (hasOther && (otherShare >= 0.1 || topCats[0]?.[0] === "Other")) {
      curated.push("‘Other’ is absorbing a lot — rename into real buckets to expose patterns.");
    }
  
    if (bigMoMChange) {
      const delta = last - prev;
      curated.push(
        `Month-over-month change: ${delta >= 0 ? "+" : ""}${fmt(delta)}.`
      );
    }
  
    if (hasSubscription) {
      curated.push("Subscriptions: use ‘one-in-one-out’ and set a monthly review reminder.");
    }
  
    if (hasGym) {
      curated.push("Gym: ask about pause or reduced-rate for 1–2 months while you review usage.");
    }
  
    if (hasAnnualish) {
      curated.push("Annuals: create a 12-month envelope (insurance/domains/licenses) to smooth spikes.");
    }
  
    if (repeatedMerchant) {
      curated.push(
        `Frequent with “${repeatedMerchant.merchant}”: set a per-visit cap or move to a cheaper plan.`
      );
    }
  
    // 5) Keep it tight: dedupe + cap
    const seen = new Set<string>();
    const suggestions = curated.filter(s => !!s && !seen.has(s) && seen.add(s)).slice(0, maxSuggestions);
  
    // Envelopes only for the top 1–2 present categories
    const envelopes = topCats.slice(0, 2).map(([cat, val]) => {
      const weekly = Math.max(10, Math.round((val / 4) / 5) * 5);
      return { category: cat, weeklyCap: weekly, targetCutPct: 12, currency };
    });
  
    // Compact narrative (always relevant, but brief)
    const narrative = choose([
      "Cap the leader, fix one recurring leak, and review weekly.",
      "Target the biggest driver, tweak one habit, and automate a small win.",
      "One cap + one change this week → steady drift down.",
    ]);
  
    return NextResponse.json({
      suggestions,
      envelopes,
      stats: {
        total,
        topCategories: topCats.map(([c, v]) => ({ category: c, amount: v })),
        months: months.map(([m, v]) => ({ month: m, total: v })),
      },
      narrative,
    });
  }
  

  if (type === "tasks.plan") {
    const tasks: Task[] = payload?.tasks ?? [];
    const now = new Date();
    const startMin = now.getHours() * 60 + now.getMinutes();
    let cursor = startMin;

    // detect blockers from notes (simple heuristic)
    const isBlocked = (t: Task) => /blocked\s*:/i.test(t.notes || "");

    const score = (t: Task) => {
      const today = new Date().toISOString().slice(0, 10);
      const due = t.due ?? "";
      const overdue = !!(due && due < today && !t.completed);
      const dueToday = due === today && !t.completed;
  const jitter = rng() * 5; // tie-break wiggle
      return (
        (overdue ? 1000 : 0) +
        (dueToday ? 500 : 0) +
        (t.priority === "high" ? 100 : t.priority === "medium" ? 50 : 10) +
        (isBlocked(t) ? -80 : 0) +
        jitter -
        (t.completed ? 10000 : 0)
      );
    };

    const active = tasks.filter((t) => !t.completed);
    const sorted = active.slice().sort((a, b) => score(b) - score(a));

    const plan = sorted.slice(0, 10).map((t) => {
      const base = t.priority === "high" ? 50 : t.priority === "medium" ? 30 : 20;
  const est = base + (maybe(0.35, rng) ? 5 : 0);
      const block = {
        id: t.id,
        title: t.title,
        from: minsToHHMM(cursor),
        to: minsToHHMM(cursor + est),
        estimateMin: est,
        blocked: isBlocked(t) || undefined,
      };
      cursor += est + 5; // 5-min buffer
      return block;
    });

    const NUDGES_POOL = [
      "Work in 25–50 min focus blocks with 5–10 min breaks.",
      "Front-load the hardest item; momentum compounds.",
      "Close each block with a 30-second note: what moved, what’s next.",
      "Batch low-complexity tasks to avoid context churn.",
      "Protect two interruption-free blocks — DND on, tabs closed.",
      "Use WIP limits: no more than 2 active tasks at once.",
      "Eisenhower it: urgent/important first, schedule the rest.",
      "Timebox admin to a single 20-minute window.",
      "If a task is stuck, write the first ugly draft or ask one concrete question.",
      "End of day: queue the first action for tomorrow — tiny and obvious.",
      "Use tags as lanes: deep-work, admin, comms, errands.",
      "Do a 5-minute weekly retro: keep, improve, drop.",
      "Group meetings together; protect a meeting-free zone.",
      "Declare a theme for today (shipping, cleanup, learning).",
      "When energy dips, run a 10-minute ‘micro-win’.",
      "Put blockers in the calendar with a name; make the ask specific.",
      "Schedule a buffer block; real days need slack.",
      "Write tasks as verbs + objects: ‘draft outline’, not ‘outline’.",
      "Kill zombie tasks: if it’s been ignored 3 times, rewrite or archive.",
      "Make the next step testably small.",
    ];
  const nudges = shuffle(NUDGES_POOL, rng).slice(0, 4);

    const tone = choose(
      [
        "Let’s ship something meaningful today.",
        "Small, finished beats big, unfinished.",
        "One clear win, then let the rest follow.",
        "Aim for momentum, not max effort.",
      ],
      rng
    );

    // Optional: group by tag buckets
    const buckets: Record<string, string[]> = {};
    for (const t of plan) {
      const orig = active.find((x) => x.id === t.id);
      const tag = orig?.tags?.[0] || "general";
      (buckets[tag] ||= []).push(t.title);
    }

    // optional text plan for UIs that like checkboxes
    const planText =
      plan.length === 0
        ? "- No active tasks to plan.\n"
        : plan.map((b) => `- [ ] ${b.from}–${b.to} — ${b.title}${b.blocked ? " (blocked)" : ""}`).join("\n");

    // blocked items surfaced
    const blocked = plan.filter((p) => p.blocked).map((p) => p.title);

    return NextResponse.json({
      plan,
      nudges,
      tone,
      planText,
      buckets,
      blocked,
    });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
