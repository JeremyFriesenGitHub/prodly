"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  // read initial value on mount
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = saved ?? (systemDark ? "dark" : "light");
    applyTheme(initial);
    setTheme(initial);
  }, []);

  function applyTheme(next: Theme) {
    const html = document.documentElement;
    // set attribute for CSS variables
    html.setAttribute("data-theme", next);
    // also toggle a dark class so any Tailwind `dark:` styles kick in
    html.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  }

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 hover:scale-105 active:scale-95"
    >
      {/* Sun / Moon icon (pure CSS) */}
      <span className="relative block h-5 w-5">
        {/* Sun base */}
        <span className={`absolute inset-0 rounded-full transition-all duration-300 ${theme === "dark" ? "scale-0 opacity-0" : "scale-100 opacity-100"} bg-yellow-400 shadow-[0_0_4px_1px_rgba(250,204,21,0.6)]`} />
        {/* Moon (circle with cut-out) */}
        <span className={`absolute inset-0 rounded-full transition-all duration-300 ${theme === "dark" ? "bg-neutral-200 scale-100 opacity-100" : "scale-0 opacity-0"}`}></span>
        <span className={`absolute top-0 left-1/3 h-5 w-5 rounded-full bg-neutral-900 transition-all duration-300 ${theme === "dark" ? "opacity-100" : "opacity-0"}`} style={{ transform: theme === "dark" ? "translateX(4px)" : "translateX(-6px)" }} />
      </span>
    </button>
  );
}
