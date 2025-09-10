"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { planTasks, PlanTasksResult } from "@/lib/mesh-local";
import Link from "next/link";

type Priority = "low" | "medium" | "high";
interface Task {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  due?: string; // ISO date string (yyyy-mm-dd)
  tags: string[];
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

interface PersistShape {
  tasks: Task[];
  streak: number;
  lastCompletionDate?: string; // yyyy-mm-dd
}

const STORAGE_KEY = "taskManagerState_v1";

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "from-emerald-400 to-teal-500",
  medium: "from-indigo-400 to-violet-500",
  high: "from-pink-500 to-rose-500",
};

function loadState(): PersistShape | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as PersistShape;
  } catch {
    return undefined;
  }
}

function saveState(data: PersistShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function relativeDue(due?: string) {
  if (!due) return "No due date";
  const now = new Date();
  const dueDate = new Date(due + "T00:00:00");
  const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `Due in ${diffDays}d`;
}

export default function TaskManagerPage() {
  // background + particles
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<
    { key: number; className: string; style: React.CSSProperties }[]
  >([]);

  // task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState<string | undefined>(
    undefined
  );

  // form state
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [due, setDue] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">(
    "all"
  );
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<"newest" | "due" | "priority">("newest");

  // AI planning state
  const [plan, setPlan] = useState<{id:string;title:string;from:string;to:string;estimateMin:number}[]>([]);
  const [nudges, setNudges] = useState<string[]>([]);
  const [planning, setPlanning] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setMounted(true);
    const arr = Array.from({ length: 12 }, (_, i) => ({
      key: i,
      className: `absolute rounded-full bg-white/10 blur-lg animate-particle${i % 3 + 1}`,
      style: {
        width: `${16 + Math.random() * 24}px`,
        height: `${16 + Math.random() * 24}px`,
        top: `${Math.random() * 90}%`,
        left: `${Math.random() * 90}%`,
        opacity: 0.5 + Math.random() * 0.5,
      },
    }));
    setParticles(arr);
    const stored = loadState();
    if (stored) {
      setTasks(stored.tasks || []);
      setStreak(stored.streak || 0);
      setLastCompletionDate(stored.lastCompletionDate);
    }
  }, []);

  // Persist
  useEffect(() => {
    if (!mounted) return;
    saveState({ tasks, streak, lastCompletionDate });
  }, [tasks, streak, lastCompletionDate, mounted]);

  const completionPct = useMemo(() => {
    if (tasks.length === 0) return 0;
    const c = tasks.filter((t) => t.completed).length;
    return Math.round((c / tasks.length) * 100);
  }, [tasks]);

  const addTask = useCallback(() => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      notes: notes.trim(),
      priority,
      due: due || undefined,
      tags,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((t) => [newTask, ...t]);
    setTitle("");
    setNotes("");
    setPriority("medium");
    setDue("");
    setTags([]);
    setTagInput("");
  }, [title, notes, priority, due, tags]);

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: !t.completed,
                completedAt: !t.completed ? Date.now() : undefined,
              }
            : t
        );
        // update streak if newly completed
        const changed = next.find((t) => t.id === id);
        if (changed && changed.completed) {
          const today = todayStr();
          if (lastCompletionDate === today) {
            // streak already counted today
          } else if (!lastCompletionDate) {
            setStreak(1);
            setLastCompletionDate(today);
          } else {
            const last = new Date(lastCompletionDate);
            const diffDays = Math.floor(
              (new Date(today).getTime() - last.getTime()) / 86400000
            );
            if (diffDays === 1) {
              setStreak((s) => s + 1);
            } else if (diffDays > 1) {
              setStreak(1);
            }
            setLastCompletionDate(today);
          }
        }
        return next;
      });
    },
    [lastCompletionDate]
  );

  const deleteTask = useCallback((id: string) => {
    setTasks((t) => t.filter((task) => task.id !== id));
  }, []);

  const updateTaskField = useCallback(
    (id: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    []
  );

  const clearCompleted = useCallback(() => {
    setTasks((t) => t.filter((task) => !task.completed));
  }, []);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (filterStatus === "active") list = list.filter((t) => !t.completed);
    if (filterStatus === "completed") list = list.filter((t) => t.completed);
    if (filterPriority !== "all") list = list.filter((t) => t.priority === filterPriority);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.tags.some((tg) => tg.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case "due":
        list.sort((a, b) => {
          if (!a.due && !b.due) return b.createdAt - a.createdAt;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return a.due.localeCompare(b.due);
        });
        break;
      case "priority":
        const order: Priority[] = ["high", "medium", "low"];
        list.sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
        break;
      default:
        list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }, [tasks, filterStatus, filterPriority, search, sort]);

	async function planMyDay() {
		try {
			setPlanning(true);
			let data: PlanTasksResult | undefined;
			try {
				const res = await fetch("/api/mesh", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ type: "tasks.plan", payload: { tasks } }),
				});
				if (res.ok) data = (await res.json()) as PlanTasksResult;
			} catch {}
			if (!data) data = planTasks(tasks);
			setPlan(data?.plan ?? []);
			setNudges(data?.nudges ?? []);
		} finally {
			setPlanning(false);
		}
	}

  const priorityBadge = (p: Priority) => {
    const label = p === "low" ? "Low" : p === "medium" ? "Medium" : "High";
    const color =
      p === "low"
        ? "bg-emerald-500"
        : p === "medium"
        ? "bg-indigo-500"
        : "bg-pink-500";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase text-white ${color}`}
      >
        {label}
      </span>
    );
  };

  // add tag on Enter
  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim();
      if (!tags.includes(t)) setTags((prev) => [...prev, t]);
      setTagInput("");
    }
  }

	return (
		<div className="relative min-h-screen min-h-dvh w-full flex flex-col items-center overflow-hidden bg-[var(--background)] font-sans">
			{/* Background */}
			<div className="absolute inset-0 pointer-events-none z-0">
				<div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-[#a5b4fc] to-[#818cf8] opacity-30 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-gradient-to-tr from-[#fca5a5] to-[#f87171] opacity-30 rounded-full blur-3xl animate-pulse" />
				<div className="absolute top-1/2 left-1/4 w-[180px] h-[180px] bg-gradient-to-br from-[#fbbf24] via-[#f87171] to-[#f43f5e] opacity-20 rounded-full blur-2xl animate-fire" />
				<div className="absolute bottom-1/3 right-1/4 w-[160px] h-[160px] bg-gradient-to-tr from-[#34d399] via-[#818cf8] to-[#fbbf24] opacity-20 rounded-full blur-2xl animate-fire2" />
				{mounted &&
					particles.map((p) => (
						<div key={p.key} className={p.className} style={p.style} />
					))}
			</div>

			<main className="relative z-10 w-full max-w-7xl px-6 sm:px-10 py-10 sm:py-16 flex flex-col gap-10">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
					<div className="space-y-3">
						<h1 className="text-4xl sm:text-6xl font-extrabold leading-tight animate-gradient-text bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
							Task Manager
						</h1>
						<p className="text-sm sm:text-base max-w-xl opacity-90">
							Capture, prioritize, and celebrate progress. Your playful hub for
							getting things done.
						</p>
						<div className="flex flex-wrap gap-3 items-center text-xs font-semibold">
							<span className="px-3 py-1 rounded-full bg-white/95 dark:bg-gray-900/50 backdrop-blur-xl border border-white/50 dark:border-gray-800/40 text-neutral-900 dark:text-white">All: {tasks.length}</span>
							<span className="px-3 py-1 rounded-full bg-white/95 dark:bg-gray-900/50 backdrop-blur-xl border border-white/50 dark:border-gray-800/40 text-neutral-900 dark:text-white">Done: {tasks.filter(t=>t.completed).length}</span>
							<span className="px-3 py-1 rounded-full bg-white/95 dark:bg-gray-900/50 backdrop-blur-xl border border-white/50 dark:border-gray-800/40 text-neutral-900 dark:text-white">Progress: {completionPct}%</span>
							<span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow">🔥 Streak: {streak}d</span>
						</div>
					</div>
					<div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
						<div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
						<button
              onClick={planMyDay}
							className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition"
              disabled={planning}
            >
              {planning ? "Planning..." : "Plan my day"}
            </button>
						<Link
							href="/pomodoro"
							className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition"
						>
							Pomodoro
						</Link>
						<Link
							href="/expenses"
							className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition"
						>
							Expenses
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

				{/* Creation Form */}
				<div
					className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-gray-900/50 shadow-xl border border-white/50 dark:border-gray-800/40 backdrop-blur-xl grid gap-6 md:grid-cols-3 lg:grid-cols-4"
					role="form"
					aria-label="Add new task"
				>
					<div className="md:col-span-2 lg:col-span-2 flex flex-col gap-4">
			<label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-800 dark:text-white">
							<span>Title</span>
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Task title *"
				className="w-full px-4 py-3 rounded-xl bg-white/95 dark:bg-gray-800/70 border border-white/50 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:opacity-60 text-sm text-neutral-900 dark:text-white"
								aria-label="Task title"
							/>
						</label>
			<label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-800 dark:text-white ">
							<span>Notes <span className="opacity-60 normal-case">(optional)</span></span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Notes..."
								rows={2}
				className="w-full resize-none px-4 py-3 rounded-xl bg-white/95 dark:bg-gray-800/70 border border-white/50 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:opacity-60 text-sm text-neutral-900 dark:text-white"
								aria-label="Task notes"
							/>
						</label>
					</div>
					<div className="flex flex-col gap-3">
			<label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-800 dark:text-white ">
							<span>Priority</span>
							<select
								value={priority}
								onChange={(e) => setPriority(e.target.value as Priority)}
				className="px-3 py-2 rounded-lg bg-white/95 dark:bg-gray-800/70 border border-white/50 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-neutral-900 dark:text-white"
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</label>
			<label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-800 dark:text-white ">
							<span>Due Date</span>
							<input
								type="date"
								value={due}
								onChange={(e) => setDue(e.target.value)}
				className="date-input px-3 py-2 rounded-lg bg-white/95 dark:bg-gray-800/70 border border-white/50 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-neutral-900 dark:text-white"
							/>
						</label>
					</div>
					<div className="flex flex-col gap-3">
			<label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-800 dark:text-white">
							<span>Tags</span>
							<input
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyDown={handleAddTag}
								placeholder="Press Enter to add"
				className="px-3 py-2 rounded-lg bg-white/95 dark:bg-gray-800/70 border border-white/50 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-neutral-900 dark:text-white"
							/>
						</label>
						<div className="flex flex-wrap gap-2">
							{tags.map((tg) => (
								<button
									key={tg}
									type="button"
									onClick={() => setTags((t) => t.filter((x) => x !== tg))}
									className="px-2 py-1 text-[10px] rounded-full bg-gradient-to-r from-indigo-400 to-pink-400 text-white font-semibold shadow hover:scale-105 active:scale-95 transition"
									aria-label={`Remove tag ${tg}`}
								>
									{tg} ✕
								</button>
							))}
						</div>
						<button
							onClick={addTask}
							disabled={!title.trim()}
							className="mt-auto w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow hover:brightness-110 hover:scale-[1.02] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Add Task
						</button>
					</div>
				</div>

				{/* Filters & Progress */}
				<div className="flex flex-col lg:flex-row gap-6">
					<div className="flex-1 flex flex-wrap gap-4 items-end">
						<div className="flex flex-col gap-1">
							<label className="text-[10px] font-semibold uppercase tracking-wide">Search</label>
							<input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search tasks..."
								className="px-4 py-2 rounded-xl bg-white/95 dark:bg-gray-900/50 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-neutral-900 dark:text-white"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-[10px] font-semibold uppercase tracking-wide">Status</label>
							<select
								value={filterStatus}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
									const v = e.target.value as 'all' | 'active' | 'completed';
									setFilterStatus(v);
								}}
								className="px-3 py-2 rounded-xl bg-white/95 dark:bg-gray-900/50 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-neutral-900 dark:text-white"
							>
								<option value="all">All</option>
								<option value="active">Active</option>
								<option value="completed">Completed</option>
							</select>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-[10px] font-semibold uppercase tracking-wide">Priority</label>
							<select
								value={filterPriority}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
									const v = e.target.value as 'all' | Priority; setFilterPriority(v);
								}}
								className="px-3 py-2 rounded-xl bg-white/95 dark:bg-gray-900/50 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-neutral-900 dark:text-white"
							>
								<option value="all">All</option>
								<option value="high">High</option>
								<option value="medium">Medium</option>
								<option value="low">Low</option>
							</select>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-[10px] font-semibold uppercase tracking-wide">Sort</label>
							<select
								value={sort}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
									const v = e.target.value as 'newest' | 'due' | 'priority'; setSort(v);
								}}
								className="px-3 py-2 rounded-xl bg-white/95 dark:bg-gray-900/50 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-neutral-900 dark:text-white"
							>
								<option value="newest">Newest</option>
								<option value="due">Due Date</option>
								<option value="priority">Priority</option>
							</select>
						</div>
						<button
							onClick={clearCompleted}
							disabled={!tasks.some((t) => t.completed)}
							className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-semibold shadow hover:brightness-110 hover:scale-[1.03] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Clear Completed
						</button>
					</div>
					<div className="w-full max-w-xs flex items-center gap-4">
						<div className="relative w-24 h-24">
							<svg viewBox="0 0 100 100" className="w-24 h-24">
								<circle
									cx="50"
									cy="50"
									r="42"
									className="stroke-white/30 dark:stroke-gray-700"
									strokeWidth="10"
									fill="none"
								/>
								<circle
									cx="50"
									cy="50"
									r="42"
									strokeLinecap="round"
									strokeWidth="10"
									fill="none"
									className="stroke-gradient"
									style={{
										strokeDasharray: 2 * Math.PI * 42,
										strokeDashoffset:
											((100 - completionPct) / 100) * (2 * Math.PI * 42),
										transition: "stroke-dashoffset 0.6s ease",
									}}
								/>
							</svg>
							<div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
								{completionPct}%
							</div>
						</div>
						<div className="flex-1 text-xs sm:text-sm space-y-2">
							<div className="font-semibold tracking-wide uppercase opacity-70">
								Completion
							</div>
							<div className="h-2 w-full rounded-full bg-white/30 dark:bg-gray-800 overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 transition-all duration-700"
									style={{ width: `${completionPct}%` }}
								/>
							</div>
							<p className="opacity-70 leading-tight">
								{completionPct === 100
									? "Perfect! All tasks done. ✨"
									: completionPct > 0
									? "Great momentum—keep going!"
									: "Add a task to get started."}
							</p>
						</div>
					</div>
				</div>

        {/* AI Day Plan */}
	<section className="rounded-3xl bg-white/95 dark:bg-gray-900/50 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl p-5 text-neutral-900 dark:text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide">AI Day Plan</h3>
            <button
              onClick={planMyDay}
              className="text-xs px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white"
              disabled={planning}
            >
              {planning ? "Planning..." : "Refresh"}
            </button>
          </div>
          {plan.length ? (
            <ol className="space-y-2 text-sm">
              {plan.map((b) => (
                <li key={b.id} className="flex items-center justify-between">
                  <span className="font-medium">{b.from}–{b.to}</span>
                  <span className="mx-2">•</span>
                  <span className="truncate">{b.title}</span>
                  <span className="opacity-80 ml-2">({b.estimateMin}m)</span>
                </li>
              ))}
            </ol>
          ) : (
			<div className="text-sm opacity-80">No plan yet — click “Plan my day”.</div>
          )}
          {!!nudges.length && (
            <ul className="mt-3 text-xs opacity-90 list-disc pl-4 space-y-1">
              {nudges.map((n,i)=><li key={i}>{n}</li>)}
            </ul>
          )}
        </section>

				{/* Task List */}
				<section aria-label="Tasks" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{filtered.map((task) => {
						const gradient = PRIORITY_COLORS[task.priority];
						return (
							<div
								key={task.id}
								className={`group relative p-5 rounded-3xl bg-white/95 dark:bg-gray-900/50 shadow-xl border border-white/50 dark:border-gray-800/40 backdrop-blur-xl flex flex-col gap-4 overflow-hidden transition hover:shadow-2xl hover:-translate-y-0.5 focus-within:shadow-2xl`}
							>
								<div
									className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br ${gradient} rounded-3xl mix-blend-overlay`}
								/>
								<div className="flex items-start gap-3 relative z-10">
									<button
										onClick={() => toggleTask(task.id)}
										aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
										className={`mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition shadow bg-background/40 backdrop-blur border-white/40 dark:border-gray-700 ${
											task.completed
												? "bg-gradient-to-br from-indigo-500 to-pink-500 text-white scale-110 rotate-6"
												: "hover:scale-110"
										}`}
									>
										{task.completed ? "✓" : ""}
									</button>
									<div className="flex-1 pr-6">
										<div className="flex flex-wrap items-center gap-2">
											<h2
												className={`font-semibold text-base leading-snug ${
													task.completed ? "line-through opacity-60" : ""
												}`}
											>
												{task.title}
											</h2>
											{priorityBadge(task.priority)}
										</div>
										{task.notes && (
											<p
												className={`text-xs mt-1 whitespace-pre-line ${
													task.completed ? "line-through opacity-50" : "opacity-80"
												}`}
											>
												{task.notes}
											</p>
										)}
										<div className="mt-3 flex flex-wrap gap-2">
											{task.tags.map((tg) => (
												<span
													key={tg}
													className="px-2 py-1 text-[10px] rounded-full bg-gradient-to-r from-indigo-400/80 to-pink-400/80 text-white font-semibold shadow"
												>
													{tg}
												</span>
											))}
										</div>
									</div>
									<button
										onClick={() => deleteTask(task.id)}
										aria-label="Delete task"
										className="absolute top-2 right-2 text-xs opacity-40 hover:opacity-100 transition font-bold"
									>
										✕
									</button>
								</div>
								<div className="flex flex-wrap items-center gap-3 justify-between relative z-10">
									<div
										className={`text-[10px] font-semibold uppercase tracking-wide ${
											task.due && new Date(task.due) < new Date() && !task.completed
												? "text-rose-500"
												: "opacity-70"
										}`}
									>
										{relativeDue(task.due)}
									</div>
									<div className="flex gap-2 ml-auto text-[10px] opacity-60">
										<button
											onClick={() => {
												const newTitle = prompt("Edit title", task.title);
												if (newTitle !== null) updateTaskField(task.id, { title: newTitle });
											}}
											className="hover:opacity-100 underline"
										>
											Edit
										</button>
										<button
											onClick={() => {
												const newNotes = prompt("Edit notes", task.notes || "");
												if (newNotes !== null) updateTaskField(task.id, { notes: newNotes });
											}}
											className="hover:opacity-100 underline"
										>
											Notes
										</button>
									</div>
								</div>
								{task.completed && task.completedAt && (
									<div className="text-[10px] opacity-60 mt-1 relative z-10">
										Done {new Date(task.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
									</div>
								)}
								<div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400" style={{ width: task.completed ? "100%" : "0%", transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
							</div>
						);
					})}
					{filtered.length === 0 && (
						<div className="col-span-full p-10 text-center rounded-3xl bg-white/95 dark:bg-gray-900/40 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl text-sm opacity-80 text-neutral-900 dark:text-white">
							No tasks match. Try adjusting filters or add one above.
						</div>
					)}
				</section>

        <footer className="text-xs text-center opacity-70 pt-4">
          Made with Next.js, React & TailwindCSS • Tasks stored locally
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
				@keyframes particle3 { 0% { transform: translateX(0) scale(1); opacity: 0.5; } 50% { transform: translateX(20px) scale(1.1); opacity: 0.7; } 100% { transform: translateX(0) scale(1); opacity: 0.5; } }
				.animate-particle3 { animation: particle3 3.7s ease-in-out infinite; }
				.stroke-gradient { stroke: url(#gradStroke); }
				/* Date input: readable in light/dark; invert icon only in dark mode */
				.date-input { color: inherit; caret-color: currentColor; }
				.date-input::-webkit-calendar-picker-indicator { filter: none; opacity: 0.9; }
				:global(html.dark) .date-input::-webkit-calendar-picker-indicator { filter: invert(1) brightness(1.6); }
				/* hide scrollbar for horizontal nav scroller */
				.no-scrollbar::-webkit-scrollbar { display: none; }
				.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
			`}</style>
			{/* Hidden SVG defs for gradient stroke */}
			<svg width="0" height="0" className="absolute">
				<defs>
					<linearGradient id="gradStroke" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#6366f1" />
						<stop offset="50%" stopColor="#ec4899" />
						<stop offset="100%" stopColor="#fbbf24" />
					</linearGradient>
				</defs>
			</svg>
		</div>
	);
}
