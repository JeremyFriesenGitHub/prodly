"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adviseExpenses, ExpenseAdviceResult } from "@/lib/mesh-local";

// ---- Types ----
export type Expense = {
  id: string; // uuid
  date: string; // ISO yyyy-mm-dd
  category: string;
  description: string;
  amount: number; // in dollars
};

// ---- Constants ----
const STORAGE_KEY = "pomodoro.expenses.v1";
const CATEGORIES = [
  "Food","Transport","Housing","Utilities","Health","Education",
  "Entertainment","Subscriptions","Shopping","Other",
];

// ---- Helpers ----
function uuid() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}
function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch { return []; }
}
function saveExpenses(items: Expense[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

// ---- Tiny UI atoms (dark-aware) ----
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {children}
    </label>
  );
}
function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border px-3 py-2 outline-none " +
        "border-neutral-300 dark:border-neutral-700 " +
        "bg-[var(--background)] text-[var(--foreground)] " +
        "focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 " +
        (props.className || "")
      }
    />
  );
}
function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }
) {
  return (
    <select
      {...props}
      className={
        "w-full rounded-xl border px-3 py-2 outline-none " +
        "border-neutral-300 dark:border-neutral-700 " +
        "bg-[var(--background)] text-[var(--foreground)] " +
        "focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 " +
        (props.className || "")
      }
    />
  );
}
function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }
) {
  const variant = props.variant ?? "primary";
  const base = "rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-50";
  const styles: Record<string, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600",
    ghost:   "bg-transparent text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    danger:  "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
  };
  const { className, children, ...rest } = props;
  return (
    <button className={`${base} ${styles[variant]} ${className || ""}`} {...rest}>
      {children}
    </button>
  );
}

// ---- Expense Form ----
function ExpenseForm({
  onAdd, defaultDate,
}: { onAdd: (e: Expense) => void; defaultDate: string }) {
  const [date, setDate] = useState(defaultDate);
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("");

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const parsed = Number(amount);
    if (!date || !category || Number.isNaN(parsed)) return;
    onAdd({ id: uuid(), date, category, description, amount: Math.max(0, parsed) });
    setDescription(""); setAmount("");
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-5">
      <div className="sm:col-span-1">
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="sm:col-span-1">
        <Label>Category</Label>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Input placeholder="e.g., Lunch, bus pass, monthly rent" value={description}
               onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="sm:col-span-1">
        <Label>Amount</Label>
        <div className="flex gap-2">
          <Input type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00"
                 value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Button type="submit">Add</Button>
        </div>
      </div>
    </form>
  );
}

// ---- Tiny bar chart ----
function TinyBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
            <span>{d.label}</span>
            <span>{currency(d.value)}</span>
          </div>
          <div className="h-2 w-full rounded bg-neutral-200 dark:bg-neutral-800">
            <div className="h-2 rounded bg-indigo-500 dark:bg-indigo-400"
                 style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- CSV helpers ----
function toCSV(items: Expense[]) {
  const header = ["id","date","category","description","amount"];
  const rows = items.map((e) =>
    [e.id, e.date, e.category, e.description.replaceAll("\n"," "), e.amount.toFixed(2)].join(",")
  );
  return [header.join(","), ...rows].join("\n");
}
function fromCSV(text: string): Expense[] {
  const lines = text.trim().split(/\r?\n/);
  const [h, ...rows] = lines;
  const expected = "id,date,category,description,amount";
  const hasHeader = h.trim().toLowerCase() === expected;
  const data = (hasHeader ? rows : lines).map((line) => {
    const [id, date, category, description, amount] =
      line.split(/,(.+)?/)[0] ? line.split(",") : ["","","","", "0"];
    return { id: id || uuid(), date, category, description, amount: Number(amount) || 0 } as Expense;
  });
  return data.filter((e) => e.date && e.category);
}

// ---- Main Page ----
export default function ExpensesPage() {
  // animated background + particles (shared theme)
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<{
    key: number;
    className: string;
    style: React.CSSProperties;
  }[]>([]);

  const [items, setItems] = useState<Expense[]>([]);
  const [query, setQuery] = useState("");
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);
  const todayISO = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setItems(loadExpenses());
  }, []);
  useEffect(() => {
    saveExpenses(items);
  }, [items]);

  // spawn particles once mounted (client only)
  useEffect(() => {
    setMounted(true);
    const arr = Array.from({ length: 12 }, (_, i) => ({
      key: i,
      className: `absolute rounded-full bg-white/10 blur-lg animate-particle${(i % 3) + 1}`,
      style: {
        width: `${16 + Math.random() * 24}px`,
        height: `${16 + Math.random() * 24}px`,
        top: `${Math.random() * 90}%`,
        left: `${Math.random() * 90}%`,
        opacity: 0.5 + Math.random() * 0.5,
      },
    }));
    setParticles(arr);
  }, []);

  function addExpense(e: Expense) {
    try {
      setItems((prev) => {
        const next = [e, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1));
        return next;
      });
      // forward to mesh (Solace Agent Mesh proxy)
      fetch("/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "expense.add", payload: e }),
      }).catch(() => {});
    } catch {}
  }

  async function askAiForExpenses() {
    try {
      setAsking(true);
      let data: ExpenseAdviceResult | undefined;
      try {
        const res = await fetch("/api/mesh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "expense.advise", payload: { items } }),
        });
        if (res.ok) data = (await res.json()) as ExpenseAdviceResult;
      } catch {}
      if (!data) {
        data = adviseExpenses(items);
      }
      setAiTips(data?.suggestions ?? []);
    } finally {
      setAsking(false);
    }
  }

  function updateExpense(id: string, patch: Partial<Expense>) {
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function deleteExpense(id: string) {
    setItems((prev) => prev.filter((e) => e.id !== id));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (e) =>
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.date.includes(q)
    );
  }, [items, query]);

  const totals = useMemo(() => items.reduce((sum, e) => sum + e.amount, 0), [items]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of items) map.set(e.category, (map.get(e.category) || 0) + e.amount);
    return Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [items]);

  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of items) {
      const m = e.date.slice(0, 7); // yyyy-mm
      map.set(m, (map.get(m) || 0) + e.amount);
    }
    return Array.from(map, ([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items]);

  function exportCSV() {
    const blob = new Blob([toCSV(items)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function importCSV(file: File) {
    const text = await file.text();
    const parsed = fromCSV(text);
    setItems((prev) => [...parsed, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1)));
  }

  return (
  <div className="relative min-h-screen min-h-dvh w-full flex flex-col items-center text-[var(--foreground)] overflow-hidden bg-[var(--background)] font-sans">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-[#a5b4fc] to-[#818cf8] opacity-30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-gradient-to-tr from-[#fca5a5] to-[#f87171] opacity-30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/4 w-[180px] h-[180px] bg-gradient-to-br from-[#fbbf24] via-[#f87171] to-[#f43f5e] opacity-20 rounded-full blur-2xl animate-fire" />
        <div className="absolute bottom-1/3 right-1/4 w-[160px] h-[160px] bg-gradient-to-tr from-[#34d399] via-[#818cf8] to-[#fbbf24] opacity-20 rounded-full blur-2xl animate-fire2" />
        {mounted && particles.map((p) => (
          <div key={p.key} className={p.className} style={p.style} />
        ))}
      </div>

      <main className="relative z-10 w-full max-w-7xl px-6 sm:px-10 py-10 sm:py-16 flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight animate-gradient-text bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
              Expenses
            </h1>
            <p className="text-sm sm:text-base max-w-xl opacity-90">
              Track spending alongside your productivity flows.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
            <div className="flex gap-2 items-center text-xs sm:text-sm overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
              <Button
                onClick={askAiForExpenses}
                className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition"
                disabled={asking}
              >
                {asking ? "Thinking..." : "Ask AI"}
              </Button>
              <Link
                href="/pomodoro"
                className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition"
              >
                Pomodoro
              </Link>
              <Link
                href="/tasks"
                className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition"
              >
                Tasks
              </Link>
              <Link
                href="/"
                className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-pink-500 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition"
              >
                Home
              </Link>
            </div>
          </div>
        </div>

        {/* CSV + Actions (top right) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="text-xs opacity-80">
            Data stored locally in your browser. Export or import as CSV anytime.
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV} className="w-full sm:w-auto" variant="ghost">Export CSV</Button>
            <label className="relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-white/70 dark:bg-gray-900/60 px-3 py-2 text-sm font-medium text-indigo-700 dark:text-neutral-200 hover:bg-white/80 dark:hover:bg-gray-900/70 cursor-pointer shadow">
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); }}
              />
            </label>
          </div>
        </div>

        {/* Form */}
  <section className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-gray-900/50 shadow-xl border border-white/50 dark:border-gray-800/40 backdrop-blur-xl">
          <ExpenseForm onAdd={addExpense} defaultDate={todayISO} />
        </section>

        {/* Metrics */}
        <section className="grid gap-6 sm:grid-cols-3">
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-gray-900/50 shadow-xl border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-neutral-900 dark:text-white">
            <div className="text-sm opacity-80">Total Spent</div>
            <div className="text-3xl font-extrabold mt-1 tabular-nums">{currency(totals)}</div>
          </div>
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-gray-900/50 shadow-xl border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-neutral-900 dark:text-white">
            <div className="mb-3 text-sm font-semibold tracking-wide uppercase opacity-80">By Category</div>
            {byCategory.length ? (
              <TinyBarChart data={byCategory.slice(0, 6)} />
            ) : (
              <div className="text-sm opacity-60">No data yet</div>
            )}
          </div>
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-gray-900/50 shadow-xl border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-neutral-900 dark:text-white">
            <div className="mb-3 text-sm font-semibold tracking-wide uppercase opacity-80">By Month</div>
            {byMonth.length ? (
              <TinyBarChart data={byMonth} />
            ) : (
              <div className="text-sm opacity-60">No data yet</div>
            )}
          </div>
        </section>

        {/* AI Suggestions */}
        <section className="p-6 rounded-3xl bg-white/95 dark:bg-gray-900/50 shadow-xl border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-neutral-900 dark:text-white">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide uppercase opacity-80">AI Suggestions</div>
            <Button variant="ghost" onClick={askAiForExpenses} disabled={asking}>
              {asking ? "Thinking..." : "Refresh"}
            </Button>
          </div>
          {aiTips.length ? (
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {aiTips.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          ) : (
            <div className="text-sm opacity-60">No suggestions yet — click “Ask AI”.</div>
          )}
        </section>

        {/* Table */}
        <section className="p-6 rounded-3xl bg-white/95 dark:bg-gray-900/50 shadow-xl border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-neutral-900 dark:text-white">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Search by description, category, or date yyyy-mm-dd"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-md"
            />
            <div className="text-sm opacity-70">{filtered.length} item(s)</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Description</th>
                  <th className="px-2 py-2 text-right">Amount</th>
                  <th className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <ExpenseRow key={e.id} e={e} onUpdate={updateExpense} onDelete={deleteExpense} />
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center opacity-60">
                      No expenses yet. Add your first one above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-xs text-center opacity-70 pt-4">
          Made with Next.js, React & TailwindCSS • Expenses stored locally
        </footer>
      </main>

      {/* Animations */}
      <style jsx>{`
        .animate-gradient-text { background-size: 200% 200%; animation: gradient-text 2.5s ease-in-out infinite alternate; }
        @keyframes gradient-text { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
        @keyframes fire { 0% { transform: scale(1) translateY(0); opacity: 0.7; } 50% { transform: scale(1.1) translateY(-10px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 0.7; } }
        .animate-fire { animation: fire 2.2s ease-in-out infinite; }
        @keyframes fire2 { 0% { transform: scale(1) translateY(0); opacity: 0.7; } 50% { transform: scale(1.15) translateY(10px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 0.7; } }
        .animate-fire2 { animation: fire2 2.7s ease-in-out infinite; }
        @keyframes particle1 { 0% { transform: translateY(0) scale(1); opacity: 0.5; } 50% { transform: translateY(-20px) scale(1.2); opacity: 0.8; } 100% { transform: translateY(0) scale(1); opacity: 0.5; } }
        .animate-particle1 { animation: particle1 3.2s ease-in-out infinite; }
        @keyframes particle2 { 0% { transform: translateY(0) scale(1); opacity: 0.5; } 50% { transform: translateY(20px) scale(0.8); opacity: 0.7; } 100% { transform: translateY(0) scale(1); opacity: 0.5; } }
        .animate-particle2 { animation: particle2 2.7s ease-in-out infinite; }
        @keyframes particle3 { 0% { transform: translateX(0) scale(1); opacity: 0.5; } 50% { transform: translateX(20px) scale(1.1); opacity: 0.7; } 100% { transform: translateX(0) scale(1); opacity: 0.5; } }
        .animate-particle3 { animation: particle3 3.7s ease-in-out infinite; }
        /* Date input styling (white icon/text like tasks page) */
        .date-input::-webkit-calendar-picker-indicator { filter: invert(1) brightness(1.8); opacity: 0.9; }
        .date-input { color: #fff; caret-color: #fff; }
        :global(html.dark) .date-input::-webkit-calendar-picker-indicator { filter: none; }
  /* hide scrollbar for horizontal nav scroller */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function ExpenseRow({
  e, onUpdate, onDelete,
}: {
  e: Expense;
  onUpdate: (id: string, patch: Partial<Expense>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  function saveField<K extends keyof Expense>(key: K, value: Expense[K]) {
    onUpdate(e.id, { [key]: value } as Partial<Expense>);
  }

  return (
    <tr className="border-t border-neutral-200 dark:border-neutral-800">
      <td className="px-2 py-2 align-top">
        {editing ? (
          <Input type="date" value={e.date} onChange={(ev) => saveField("date", ev.target.value)} />
        ) : (
          <div className="tabular-nums">{e.date}</div>
        )}
      </td>
      <td className="px-2 py-2 align-top">
        {editing ? (
          <Select value={e.category} onChange={(ev) => saveField("category", ev.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        ) : (
          <span className="inline-flex rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs text-neutral-700 dark:text-neutral-300">
            {e.category}
          </span>
        )}
      </td>
      <td className="px-2 py-2 align-top">
        {editing ? (
          <Input value={e.description} onChange={(ev) => saveField("description", ev.target.value)} />
        ) : (
          <div className="max-w-md truncate" title={e.description}>
            {e.description || <span className="text-neutral-400 dark:text-neutral-500">—</span>}
          </div>
        )}
      </td>
      <td className="px-2 py-2 align-top text-right">
        {editing ? (
          <Input
            type="number" inputMode="decimal" step="0.01" min="0"
            value={e.amount}
            onChange={(ev) => saveField("amount", Number(ev.target.value) || 0)}
          />
        ) : (
          <div className="tabular-nums">{currency(e.amount)}</div>
        )}
      </td>
      <td className="px-2 py-2 align-top text-right">
        {editing ? (
          <div className="inline-flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>Done</Button>
            <Button variant="danger" onClick={() => onDelete(e.id)}>Delete</Button>
          </div>
        ) : (
          <div className="inline-flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" onClick={() => onDelete(e.id)}>Delete</Button>
          </div>
        )}
      </td>
    </tr>
  );
}
