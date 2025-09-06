"use client";
import React, { useEffect, useMemo, useState } from "react";

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
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
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
  const [items, setItems] = useState<Expense[]>([]);
  const [query, setQuery] = useState("");
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);
  const todayISO = new Date().toISOString().slice(0, 10);

  useEffect(() => { setItems(loadExpenses()); }, []);
  useEffect(() => { saveExpenses(items); }, [items]);

  function addExpense(e: Expense) {
    try {
      // update UI immediately
      setItems((prev) => {
        const next = [e, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1));
        return next;
      });
      // best-effort forward to local “mesh” API (no UI block)
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
      const res = await fetch("/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "expense.advise", payload: { items } }),
      });
      const data = await res.json();
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
    <div className="mx-auto max-w-6xl space-y-6 p-6 bg-[var(--background)] text-[var(--foreground)]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Track spending alongside your Pomodoro focus.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={askAiForExpenses} className="w-full sm:w-auto">
            {asking ? "Thinking..." : "Ask AI"}
          </Button>
          <Button onClick={exportCSV} className="w-full sm:w-auto" variant="ghost">Export CSV</Button>
          <label className="relative inline-flex items-center justify-center overflow-hidden rounded-xl
                             bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-sm font-medium
                             text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer">
            Import CSV
            <input
              type="file" accept=".csv,text/csv"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); }}
            />
          </label>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--background)] p-4 shadow-sm">
        <ExpenseForm onAdd={addExpense} defaultDate={todayISO} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--background)] p-4 shadow-sm">
          <div className="text-sm text-[var(--foreground)]/60">Total Spent</div>
          <div className="text-2xl font-bold">{currency(totals)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--background)] p-4 shadow-sm">
          <div className="mb-2 text-sm font-medium text-[var(--foreground)]">By Category</div>
          {byCategory.length ? <TinyBarChart data={byCategory.slice(0, 6)} /> : (
            <div className="text-sm text-[var(--foreground)]/60">No data yet</div>
          )}
        </div>
        <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--background)] p-4 shadow-sm">
          <div className="mb-2 text-sm font-medium text-[var(--foreground)]">By Month</div>
          {byMonth.length ? <TinyBarChart data={byMonth} /> : (
            <div className="text-sm text-[var(--foreground)]/60">No data yet</div>
          )}
        </div>
      </section>

      {/* AI suggestions */}
      <section className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--background)] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">AI Suggestions</div>
          <Button variant="ghost" onClick={askAiForExpenses} disabled={asking}>
            {asking ? "Thinking..." : "Refresh"}
          </Button>
        </div>
        {aiTips.length ? (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {aiTips.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        ) : (
          <div className="text-sm text-[var(--foreground)]/60">No suggestions yet — click “Ask AI”.</div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--background)] p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search by description, category, or date yyyy-mm-dd"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-md"
          />
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{filtered.length} item(s)</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-600 dark:text-neutral-300">
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
                  <td colSpan={5} className="px-2 py-6 text-center text-neutral-500 dark:text-neutral-400">
                    No expenses yet. Add your first one above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
