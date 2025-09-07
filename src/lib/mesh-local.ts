// Local mesh logic extracted so pages can fallback when /api/mesh is unavailable (static export)

export type Expense = { id: string; date: string; category: string; description: string; amount: number };
export type Task = { id: string; title: string; notes: string; priority: "low"|"medium"|"high"; due?: string; tags: string[]; completed: boolean; createdAt: number; completedAt?: number };

// Expense advice ---------------------------------
export interface ExpenseAdviceEnvelope { category: string; weeklyCap: number; targetCutPct: number; currency: string }
export interface ExpenseAdviceStats { total: number; topCategories: { category: string; amount: number }[]; months: { month: string; total: number }[] }
export interface ExpenseAdviceResult {
  suggestions: string[];
  envelopes: ExpenseAdviceEnvelope[];
  stats: ExpenseAdviceStats;
  narrative: string;
}

export function adviseExpenses(items: Expense[], opts?: { currency?: string; maxSuggestions?: number; seed?: number }): ExpenseAdviceResult {
  const currency = opts?.currency || "CAD";
  const DEFAULT_MAX_SUGGESTIONS = 6;
  const maxSuggestions = Math.max(3, Math.min(10, Number(opts?.maxSuggestions ?? DEFAULT_MAX_SUGGESTIONS)));

  const makeRng = (seed: number) => { let t = seed >>> 0; return () => ((t = (t * 1664525 + 1013904223) >>> 0) / 2 ** 32); };
  const rng = Number.isFinite(opts?.seed) ? makeRng(Number(opts?.seed)) : Math.random;
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
      prev.count += 1; prev.total += amt; byMerchant.set(merchantKey, prev);
    }
  }

  const total = [...byCategory.values()].reduce((a,b)=>a+b,0);
  const months = [...byMonth.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  const last = months.at(-1)?.[1] ?? 0; const prev = months.at(-2)?.[1] ?? 0;
  const topCats = [...byCategory.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3);

  const fmt = (n: number) => n.toLocaleString(undefined,{ style:"currency", currency, maximumFractionDigits:2 });

  if (!items.length) {
    return { suggestions:["Add a few expenses so I can spot real trends and propose targeted caps."], envelopes:[], stats:{ total:0, topCategories:[], months:[] }, narrative:"Once you add some data, I’ll flip into analysis mode." };
  }

  const dominant40 = total>0 && [...byCategory.values()].some(v=>v/total>0.4);
  const hasOther = byCategory.has("Other");
  const otherShare = hasOther ? (byCategory.get("Other")! / Math.max(total,1)) : 0;

  const SUB_KEYS = ["sub","subscription","spotify","netflix","prime","youtube","icloud","onedrive","adobe","canva","membership"];
  const GYM_KEYS = ["gym","fitness","classpass"];
  const ANNUAL_KEYS = ["insurance","domain","license","registration","tax","tuition","membership","annual"];

  const hasSubscription = items.some(i=>SUB_KEYS.some(k => i.description?.toLowerCase().includes(k)));
  const hasGym = items.some(i=>GYM_KEYS.some(k => i.description?.toLowerCase().includes(k)));
  const hasAnnualish = items.some(i=>ANNUAL_KEYS.some(k => i.description?.toLowerCase().includes(k)));

  const repeatedMerchant = [...byMerchant.entries()].map(([m,v])=>({ merchant:m, ...v })).filter(x=>x.count>=3 && x.total>=50).sort((a,b)=>b.total-a.total)[0];
  const bigMoMChange = months.length>=2 && Math.abs(last-prev)/Math.max(prev,1) >= 0.2;

  const CAT_TIPS: Record<string,string[]> = {
    Groceries:["Groceries: plan 3 core meals, shop your list, and anchor around store-brand staples.","Groceries: buy base items in bulk (rice, beans, oats) and let meals orbit them."],
    "Food & Dining":["Food & Dining: swap one dining-out this week for a home cook; bank the difference.","Food & Dining: set a per-outing cap and pre-decide the number of outings."],
    Restaurants:["Restaurants: pick one ‘treat night’ and keep the rest to home meals.","Restaurants: default to water; sides add up quickly."],
    Transport:["Transport: batch errands into one trip; fewer cold starts saves real fuel.","Transport: map the week—stack nearby stops to cut cross-town backtracking."],
    Fuel:["Fuel: keep tires properly inflated; it’s a quiet efficiency gain.","Fuel: combine short trips; cold engines burn more."],
    Gas:["Gas: group short drives; quick hops are the least efficient.","Gas: check tire pressure; small PSI gaps cost over a month."],
    Travel:["Travel: price alerts + flexible dates usually beat fixed-date searches.","Travel: pack snacks/water to avoid high airport/road markups."],
    Shopping:["Shopping: 24-hour cooldown → wishlist first, cart later.","Shopping: filter by ‘needs’ only this month; wants go to next month’s list."],
    Utilities:["Utilities: compare current plan vs. new-customer promos; ask for a retention match.","Utilities: auto-read your usage; set alerts for spikes."],
    Entertainment:["Entertainment: rotate one streamer per month; ‘one-in-one-out’ keeps costs sane.","Entertainment: library/app bundles can replace single-purpose subs."],
    Health:["Health: ask providers about cash-pay or preventative bundle discounts.","Health: schedule routine care in one window to avoid extra trips."],
    Gym:["Gym: check pause/reduced-rate options for 1–2 months while you reassess.","Gym: if usage < 6 visits/month, pay-per-visit might be cheaper."],
    Other:["Other: rename ‘Other’ items into specific buckets; precision changes behavior."],
  };

  const normalizeCat = (c:string) => {
    const s = (c||"").toLowerCase();
    if(/grocery|grocer|supermarket/.test(s)) return "Groceries";
    if(/food|dining|eat|cafe|coffee|restaurant/.test(s)) return "Food & Dining";
    if(/restaurant/.test(s)) return "Restaurants";
    if(/transport|transit|uber|lyft|taxi/.test(s)) return "Transport";
    if(/fuel|gasoline|diesel/.test(s)) return "Fuel";
    if(/gas\b/.test(s)) return "Gas";
    if(/travel|flight|hotel|airbnb/.test(s)) return "Travel";
    if(/shop|retail|apparel|clothes|electronics/.test(s)) return "Shopping";
    if(/utility|internet|wifi|electric|power|water|gas bill/.test(s)) return "Utilities";
    if(/entertainment|movies|music|games/.test(s)) return "Entertainment";
    if(/health|pharmacy|doctor|dentist/.test(s)) return "Health";
    if(/gym|fitness/.test(s)) return "Gym";
    if(/other|misc/.test(s)) return "Other";
    return c || "Other";
  };

  const curated: string[] = [];
  curated.push(choose(["Quick snapshot:","Here’s the short read:","Fast overview:"]),`You’ve logged ${fmt(total)}${months.length?`; last month ${fmt(prev)}, this month ${fmt(last)}`:""}.`);
  if(topCats[0]) { const [cat,val] = topCats[0]; curated.push(`${choose(["Top category","Largest bucket","Biggest driver"])}: ${cat} at ${fmt(val)}.`); }
  for (const [rawCat] of topCats.slice(0,2)) { const key = normalizeCat(rawCat); if (CAT_TIPS[key]?.length) curated.push(choose(CAT_TIPS[key])); }
  if(dominant40) curated.push("Alert: one category is >40% of spend — add a weekly cap + split rules.");
  if(hasOther && (otherShare>=0.1 || topCats[0]?.[0]==="Other")) curated.push("‘Other’ is absorbing a lot — rename into real buckets to expose patterns.");
  if(bigMoMChange) { const delta = last - prev; curated.push(`Month-over-month change: ${delta>=0?"+":""}${fmt(delta)}.`); }
  if(hasSubscription) curated.push("Subscriptions: use ‘one-in-one-out’ and set a monthly review reminder.");
  if(hasGym) curated.push("Gym: ask about pause or reduced-rate for 1–2 months while you review usage.");
  if(hasAnnualish) curated.push("Annuals: create a 12-month envelope (insurance/domains/licenses) to smooth spikes.");
  if(repeatedMerchant) curated.push(`Frequent with “${repeatedMerchant.merchant}”: set a per-visit cap or move to a cheaper plan.`);

  const seen = new Set<string>();
  const suggestions = curated.filter(s=>!!s && !seen.has(s) && seen.add(s)).slice(0,maxSuggestions);
  const envelopes = topCats.slice(0,2).map(([cat,val])=>({ category:cat, weeklyCap: Math.max(10, Math.round((val/4)/5)*5), targetCutPct:12, currency }));
  const narrative = choose([
    "Cap the leader, fix one recurring leak, and review weekly.",
    "Target the biggest driver, tweak one habit, and automate a small win.",
    "One cap + one change this week → steady drift down.",
  ]);

  return { suggestions, envelopes, stats:{ total, topCategories: topCats.map(([c,v])=>({ category:c, amount:v })), months: months.map(([m,v])=>({ month:m, total:v })) }, narrative };
}

// Task planning ----------------------------------
export interface PlannedBlock { id: string; title: string; from: string; to: string; estimateMin: number; blocked?: boolean }
export interface PlanTasksResult { plan: PlannedBlock[]; nudges: string[]; tone: string; planText: string; buckets: Record<string,string[]>; blocked: string[] }
export function planTasks(tasks: Task[], opts?: { seed?: number }): PlanTasksResult {
  // local helpers (duplicated lightweightly to avoid importing server module)
  const seeded = (seed: number) => { let x = seed || 123456789; return function(){ x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x>>>0)%1_000_000)/1_000_000; }; };
  const minsToHHMM = (total:number) => { const h = Math.floor(total/60)%24; const m = total%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; };
  const shuffle = <T,>(arr:T[], rng=Math.random) => { const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const choose = <T,>(arr:T[], rng=Math.random) => arr[Math.floor(rng()*arr.length)];
  const seed = Number(opts?.seed ?? 0);
  const rng = seed ? seeded(seed) : Math.random;
  const maybeFn = (p:number)=> rng() < p;

  const isBlocked = (t: Task) => /blocked\s*:/i.test(t.notes || "");
  const score = (t: Task) => {
    const today = new Date().toISOString().slice(0,10);
    const due = t.due ?? ""; const overdue = !!(due && due < today && !t.completed); const dueToday = due === today && !t.completed;
    const jitter = rng() * 5;
    return (overdue?1000:0)+(dueToday?500:0)+(t.priority==="high"?100:t.priority==="medium"?50:10)+(isBlocked(t)?-80:0)+jitter-(t.completed?10000:0);
  };
  const active = tasks.filter(t=>!t.completed);
  const sorted = active.slice().sort((a,b)=>score(b)-score(a));
  let cursor = new Date().getHours()*60 + new Date().getMinutes();
  const plan = sorted.slice(0,10).map(t=>{ const base = t.priority==="high"?50:t.priority==="medium"?30:20; const est = base + (maybeFn(0.35)?5:0); const block = { id:t.id, title:t.title, from:minsToHHMM(cursor), to:minsToHHMM(cursor+est), estimateMin:est, blocked: isBlocked(t)||undefined }; cursor += est + 5; return block; });
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
  const nudges = shuffle(NUDGES_POOL, rng).slice(0,4);
  const tone = choose([
    "Let’s ship something meaningful today.",
    "Small, finished beats big, unfinished.",
    "One clear win, then let the rest follow.",
    "Aim for momentum, not max effort.",
  ], rng);

  const buckets: Record<string,string[]> = {};
  for (const b of plan) {
    const orig = active.find(x=>x.id===b.id);
    const tag = orig?.tags?.[0] || "general";
    (buckets[tag] ||= []).push(b.title);
  }

  const planText = plan.length===0 ? "- No active tasks to plan.\n" : plan.map(b=>`- [ ] ${b.from}–${b.to} — ${b.title}${b.blocked?" (blocked)":""}`).join("\n");
  const blocked = plan.filter(p=>p.blocked).map(p=>p.title);
  return { plan, nudges, tone, planText, buckets, blocked };
}
