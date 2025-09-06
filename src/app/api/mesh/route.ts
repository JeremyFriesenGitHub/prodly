// NEW FILE: app/api/mesh/route.ts
import { NextResponse } from "next/server";

type Expense = { id: string; date: string; category: string; description: string; amount: number };
type Task = {
  id: string; title: string; notes: string; priority: "low" | "medium" | "high";
  due?: string; tags: string[]; completed: boolean; createdAt: number; completedAt?: number;
};

export async function POST(req: Request) {
  const { type, payload } = await req.json();

  // If you later wire Solace Agent Mesh, forward here instead of local rules:
  // return fetch(process.env.BACKEND_URL + "/api/v1/message:send", { ... });

  if (type === "expense.add") {
    // no-op stub so your existing call succeeds
    return NextResponse.json({ ok: true });
  }

  if (type === "expense.advise") {
    const items: Expense[] = payload?.items ?? [];
    const byCategory = new Map<string, number>();
    const byMonth = new Map<string, number>();
    for (const e of items) {
      byCategory.set(e.category, (byCategory.get(e.category) || 0) + (e.amount || 0));
      const ym = e.date?.slice(0, 7);
      if (ym) byMonth.set(ym, (byMonth.get(ym) || 0) + (e.amount || 0));
    }
    const topCats = [...byCategory.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3);

    const tips: string[] = [];
    if (items.length === 0) tips.push("Add a few expenses so I can spot trends and suggest budgets.");
    const total = [...byCategory.values()].reduce((a,b)=>a+b,0);
    if (total > 0) tips.push(`You’ve logged ${total.toLocaleString(undefined,{style:"currency",currency:"USD"})} total so far.`);
    if (topCats[0]) tips.push(`Top category is ${topCats[0][0]} — consider a weekly cap and moving non-essentials to lower-cost alternatives.`);
    if (topCats[1]) tips.push(`Second-highest: ${topCats[1][0]}. Can any of these be reduced or scheduled less often?`);
    if (byMonth.size >= 2) {
      const months = [...byMonth.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
      const change = months.at(-1)![1] - months.at(-2)![1];
      if (Math.abs(change) > 0) tips.push(`Month-over-month change: ${change>=0?"+":""}${change.toFixed(2)} (USD).`);
    }
    tips.push("Try the 50/30/20 split as a baseline: needs/wants/saving-investing.");

    return NextResponse.json({ suggestions: tips });
  }

  if (type === "tasks.plan") {
    const tasks: Task[] = payload?.tasks ?? [];
    const now = new Date();
    const startMin = now.getHours()*60 + now.getMinutes();
    let cursor = startMin;

    // Score tasks: overdue > due today > high priority > others
    const score = (t: Task) => {
      const today = new Date().toISOString().slice(0,10);
      const due = t.due ?? "";
      const overdue = !!(due && due < today && !t.completed);
      const dueToday = due === today && !t.completed;
      return (overdue?1000:0) + (dueToday?500:0) + (t.priority==="high"?100: t.priority==="medium"?50:10) - (t.completed?10000:0);
    };

    const plan = tasks
      .slice()
      .sort((a,b)=>score(b)-score(a))
      .filter(t=>!t.completed)
      .slice(0,8) // keep it short
      .map((t) => {
        const est = t.priority==="high" ? 50 : t.priority==="medium" ? 30 : 20; // minutes
        const block = { id: t.id, title: t.title, from: minsToHHMM(cursor), to: minsToHHMM(cursor+est), estimateMin: est };
        cursor += est + 5; // 5-min buffer
        return block;
      });

    const nudges: string[] = [];
    if (!plan.length) nudges.push("No active tasks to plan. Add one and I’ll build a schedule.");
    else nudges.push("Work in 25–50 min focus blocks with 5–10 min breaks.");

    return NextResponse.json({ plan, nudges });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

function minsToHHMM(total: number) {
  const h = Math.floor(total/60)%24;
  const m = total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
