"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import ThemeToggle from "./theme-toggle";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function handle() { if (window.innerWidth >= 768) setOpen(false); }
    window.addEventListener('resize', handle); return () => window.removeEventListener('resize', handle);
  }, []);
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--foreground)]/10 bg-[var(--background)]/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-3">
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--foreground)]/20 hover:bg-[var(--foreground)]/10 transition"
          onClick={() => setOpen(o => !o)}
        >
          <span className="block w-4 space-y-1">
            <span className={`block h-0.5 bg-current transition-transform ${open ? 'translate-y-1.5 rotate-45' : ''}`}></span>
            <span className={`block h-0.5 bg-current transition-opacity ${open ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`block h-0.5 bg-current transition-transform ${open ? '-translate-y-1.5 -rotate-45' : ''}`}></span>
          </span>
        </button>
        <Link href="/" className="font-semibold hover:opacity-80">Home</Link>
        <div className="hidden md:flex items-center gap-6 text-sm ml-auto">
          <Link href="/pomodoro" className="font-medium hover:opacity-80">Pomodoro</Link>
          <Link href="/expenses" className="font-medium hover:opacity-80">Expenses</Link>
          <Link href="/tasks" className="font-medium hover:opacity-80">Tasks</Link>
          <ThemeToggle />
        </div>
      </div>
      <div className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${open ? 'max-h-64' : 'max-h-0'}`}>
        <div className="px-6 pb-4 flex flex-col gap-2 text-sm">
          <Link onClick={() => setOpen(false)} href="/pomodoro" className="py-2 border-b border-[var(--foreground)]/10">Pomodoro</Link>
          <Link onClick={() => setOpen(false)} href="/expenses" className="py-2 border-b border-[var(--foreground)]/10">Expenses</Link>
          <Link onClick={() => setOpen(false)} href="/tasks" className="py-2 border-b border-[var(--foreground)]/10">Tasks</Link>
          <Link onClick={() => setOpen(false)} href="/" className="py-2">Home</Link>
        </div>
      </div>
    </nav>
  );
}
