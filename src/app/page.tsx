"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  // particle state
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<
    { key: number; className: string; style: React.CSSProperties }[]
  >([]);

  useEffect(() => {
    setMounted(true);
    const arr = Array.from({ length: 12 }, (_, i) => ({
      key: i,
      className: `absolute rounded-full bg-white/10 blur-lg animate-particle${
        i % 3 + 1
      }`,
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

  return (
  <div className="relative min-h-screen w-full flex flex-col text-[var(--foreground)] overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Gradient blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-[#a5b4fc] to-[#818cf8] opacity-30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-gradient-to-tr from-[#fca5a5] to-[#f87171] opacity-30 rounded-full blur-3xl animate-pulse" />
        {/* Fire-like blobs */}
        <div className="absolute top-1/2 left-1/4 w-[180px] h-[180px] bg-gradient-to-br from-[#fbbf24] via-[#f87171] to-[#f43f5e] opacity-20 rounded-full blur-2xl animate-fire" />
        <div className="absolute bottom-1/3 right-1/4 w-[160px] h-[160px] bg-gradient-to-tr from-[#34d399] via-[#818cf8] to-[#fbbf24] opacity-20 rounded-full blur-2xl animate-fire2" />
        {/* Floating particles */}
        {mounted &&
          particles.map((p) => (
            <div key={p.key} className={p.className} style={p.style} />
          ))}
      </div>
      {/* Content */}
      <div className="relative z-10 w-full px-6 sm:px-12 lg:px-24 pt-28 pb-40 flex flex-col gap-28">
        {/* Hero Section */}
        <section className="flex flex-col-reverse gap-14 xl:flex-row xl:items-center">
          <div className="flex-1 space-y-8 text-center xl:text-left">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight animate-gradient-text bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
                Prodly,<br className="hidden md:block" /> a Productivity Stack
              </h1>
              <p className="text-base sm:text-xl max-w-2xl mx-auto xl:mx-0 opacity-90">
                Pomodoro timing, task orchestration & expense clarity—unified and AI‑aware so you can execute, adapt, and grow without friction.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center xl:justify-start">
              <Link href="/pomodoro" className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition text-sm sm:text-base">
                Start a Focus Session
              </Link>
              <Link href="/tasks" className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition text-sm sm:text-base">
                Plan My Day
              </Link>
              <Link href="/expenses" className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition text-sm sm:text-base">
                Log an Expense
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 pt-4 text-sm justify-center xl:justify-start">
              <div className="flex items-center gap-2"><span className="text-xl">⚡</span><span>Zero server signup—data local & instant</span></div>
              <div className="flex items-center gap-2"><span className="text-xl">🧠</span><span>AI suggestions baked in</span></div>
              <div className="flex items-center gap-2"><span className="text-xl">🔐</span><span>Own your data</span></div>
            </div>
          </div>
          <div className="flex-1 hidden xl:flex items-center justify-center relative">
            <div className="relative w-full max-w-md aspect-square rounded-[2.5rem] p-1 bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-300 shadow-2xl">
              <div className="absolute inset-0 rounded-[2.3rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),rgba(255,255,255,0)_60%)] pointer-events-none" />
              <div className="h-full w-full rounded-[2.1rem] bg-neutral-50/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/40 dark:border-neutral-700 flex flex-col items-center justify-center gap-6 text-center px-8">
                <p className="text-sm uppercase tracking-wide font-semibold opacity-70 text-white">Unified Workspace</p>
                <p className="text-lg sm:text-2xl font-extrabold leading-tight text-transparent">
                  <span className="bg-gradient-to-r from-indigo-300 via-pink-300 to-amber-200 bg-clip-text">Focus</span>
                  <span className="bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400 bg-clip-text"> • Execute • Reflect</span>
                </p>
                <p className="text-xs opacity-70 max-w-sm text-white">One keyboard shortcut away from clarity—switch contexts without breaking flow.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section aria-label="Core Features" className="w-full">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-10">Everything you need to stay in motion</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Link href="/pomodoro" className="group p-8 flex flex-col items-center rounded-3xl bg-white/60 dark:bg-gray-900/50 shadow-xl border border-white/30 dark:border-gray-800/40 glass-card backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white">
              <span className="text-4xl mb-2 group-hover:scale-110 transition">🍅</span>
              <h3 className="font-semibold text-xl text-white">Stay Focused</h3>
              <p className="text-sm mt-2 text-white/80 text-center">Structured intervals to beat distractions & build deep work momentum.</p>
              <span className="mt-4 text-xs font-semibold uppercase tracking-wide bg-white/15 text-white px-3 py-1 rounded-full">Open Timer →</span>
            </Link>
            <Link href="/expenses" className="group p-8 flex flex-col items-center rounded-3xl bg-white/60 dark:bg-gray-900/50 shadow-xl border border-white/30 dark:border-gray-800/40 glass-card backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-white">
              <span className="text-4xl mb-2 group-hover:scale-110 transition">💸</span>
              <h3 className="font-semibold text-xl text-white">Track Spending</h3>
              <p className="text-sm mt-2 text-white/80 text-center">Log expenses effortlessly & recognize habit patterns over time.</p>
              <span className="mt-4 text-xs font-semibold uppercase tracking-wide bg-white/15 text-white px-3 py-1 rounded-full">Open Expenses →</span>
            </Link>
            <Link href="/tasks" className="group p-8 flex flex-col items-center rounded-3xl bg-white/60 dark:bg-gray-900/50 shadow-xl border border-white/30 dark:border-gray-800/40 glass-card backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-white">
              <span className="text-4xl mb-2 group-hover:scale-110 transition">🎉</span>
              <h3 className="font-semibold text-xl text-white">Celebrate Progress</h3>
              <p className="text-sm mt-2 text-white/80 text-center">See streaks & wins to stay motivated every single day.</p>
              <span className="mt-4 text-xs font-semibold uppercase tracking-wide bg-white/15 text-white px-3 py-1 rounded-full">Open Tasks →</span>
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section aria-label="How It Works" className="max-w-6xl mx-auto w-full">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-12">How it works</h2>
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {[
              { icon: "1", title: "Capture", body: "Add tasks & expenses instantly—zero friction UI." },
              { icon: "2", title: "Focus", body: "Run Pomodoro cycles and protect deep work intervals." },
              { icon: "3", title: "Reflect", body: "View streaks, spending breakdowns & momentum signals." },
              { icon: "4", title: "Adapt", body: "Ask AI for nudges and a smart day plan anytime." },
            ].map(step => (
              <li key={step.title} className="flex flex-col gap-3 p-6 rounded-2xl bg-white/60 dark:bg-gray-900/50 border border-white/30 dark:border-gray-800/40 backdrop-blur-xl shadow text-white">
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white text-xs font-bold shadow">{step.icon}</span>
                <h3 className="font-semibold text-sm tracking-wide uppercase text-white">{step.title}</h3>
                <p className="text-xs text-white/80 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Productivity Stack */}
        <section aria-label="Productivity Stack" className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold">A cohesive loop—not disconnected tabs</h2>
              <p className="opacity-85 text-sm sm:text-base leading-relaxed max-w-prose">Most tools isolate focus, tasks, and finances. Prodly keeps them contextually aware so your actions in one area inform helpful suggestions in another. Short feedback loops keep you motivated.</p>
              <ul className="space-y-3 text-sm">
                {[
                  'Local-first data (instant & private)',
                  'Adaptive Pomodoro pacing',
                  'AI day planning + spending tips',
                  'Light/dark theming & minimal friction',
                ].map(f => <li key={f} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✔</span><span>{f}</span></li>)}
              </ul>
            </div>
            <div className="relative p-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-300 shadow-xl">
              <div className="rounded-[1.3rem] h-full w-full bg-neutral-50/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/40 dark:border-neutral-700 p-8 flex flex-col gap-6 text-white">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Signal Flow</h3>
                <div className="flex flex-col gap-4 text-xs text-white/80">
                  <div className="flex items-center gap-2"><span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium">Focus</span><span className="opacity-70">→ informs task prioritization</span></div>
                  <div className="flex items-center gap-2"><span className="px-2 py-1 rounded bg-pink-500/20 text-pink-600 dark:text-pink-300 font-medium">Tasks</span><span className="opacity-70">→ build streak & completion metrics</span></div>
                  <div className="flex items-center gap-2"><span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-medium">Expenses</span><span className="opacity-70">→ pattern suggestions & budget cues</span></div>
                  <div className="flex items-center gap-2"><span className="px-2 py-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-medium">AI</span><span className="opacity-70">→ contextual nudges across all</span></div>
                </div>
                <Link href="/tasks" className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-500 text-white text-sm font-semibold shadow hover:brightness-110 hover:scale-[1.03] active:scale-95 transition">Explore Workflow →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-label="FAQ" className="max-w-5xl mx-auto w-full">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-12">FAQ</h2>
          <div className="space-y-6">
            {[
              { q: 'Do I need an account?', a: 'Nope. This is an open-source tool. Feel free to use it without an account!' },
              { q: 'Is my data sent to a server?', a: 'No, your data stays locally embedded within your browser. AI requests only send the minimum needed for suggestions.' },
              { q: 'Can I reset everything?', a: 'Yes—clear site data / local storage or use the export first then clear.' },
              { q: 'Will there be syncing?', a: 'Potentially in the future with end-to-end encryption for more privacy and security.' },
            ].map(item => (
              <details key={item.q} className="group rounded-xl border border-white/30 dark:border-gray-800/40 bg-white/50 dark:bg-gray-900/40 backdrop-blur-xl p-5 text-white">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                  <span className="font-medium text-sm text-white">{item.q}</span>
                  <span className="text-xs text-white/60 group-open:rotate-180 transition">▼</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-white/80 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section aria-label="Get Started" className="max-w-4xl mx-auto w-full text-center flex flex-col items-center gap-8 py-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400 bg-clip-text text-transparent">Ready to build your streak?</h2>
          <p className="max-w-2xl text-sm sm:text-base opacity-85">Open a focus session or plan your day. You can always export everything—no lock‑in, just clarity.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/pomodoro" className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition text-sm sm:text-base">Launch Pomodoro</Link>
            <Link href="/tasks" className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition text-sm sm:text-base">Open Tasks</Link>
            <Link href="/expenses" className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow hover:brightness-110 hover:scale-[1.04] active:scale-95 transition text-sm sm:text-base">View Expenses</Link>
          </div>
        </section>

        <footer className="text-xs text-center lg:text-left opacity-70 max-w-7xl mx-auto pt-10 border-t border-white/20 dark:border-gray-800/40">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
            <div>
              <span className="font-bold">Prodly</span> • Open-sourced productivity playground
            </div>
            <div className="flex flex-wrap gap-4 justify-center text-[10px] uppercase tracking-wide opacity-70">
              <Link href="/pomodoro" className="hover:opacity-100">Pomodoro</Link>
              <Link href="/tasks" className="hover:opacity-100">Tasks</Link>
              <Link href="/expenses" className="hover:opacity-100">Expenses</Link>
              <a href="#faq" className="hover:opacity-100">FAQ</a>
            </div>
            <div className="opacity-60">© {new Date().getFullYear()} Prodly</div>
          </div>
        </footer>
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-gradient-text {
          background-size: 200% 200%;
          animation: gradient-text 2.5s ease-in-out infinite alternate;
        }
        @keyframes gradient-text {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        /* keep card enhancement */
        .glass-card { box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18); }
        @keyframes fire {
          0% {
            transform: scale(1) translateY(0);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.1) translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 0.7;
          }
        }
        .animate-fire {
          animation: fire 2.2s ease-in-out infinite;
        }
        @keyframes fire2 {
          0% {
            transform: scale(1) translateY(0);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.15) translateY(10px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 0.7;
          }
        }
        .animate-fire2 {
          animation: fire2 2.7s ease-in-out infinite;
        }
        @keyframes particle1 {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
        }
        .animate-particle1 {
          animation: particle1 3.2s ease-in-out infinite;
        }
        @keyframes particle2 {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translateY(20px) scale(0.8);
            opacity: 0.7;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
        }
        .animate-particle2 {
          animation: particle2 2.7s ease-in-out infinite;
        }
        @keyframes particle3 {
          0% {
            transform: translateX(0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translateX(20px) scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 0.5;
          }
        }
        .animate-particle3 {
          animation: particle3 3.7s ease-in-out infinite;
        }
      `}</style>
  </div>
  );
}
