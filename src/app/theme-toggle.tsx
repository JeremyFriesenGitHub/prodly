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
      className="ml-auto inline-flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-sm
                 bg-white/70 dark:bg-black/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
      aria-label="Toggle theme"
    >
      <span className="inline-block h-4 w-4 rounded-full border border-current"
            style={{ background: theme === "dark" ? "#0a0a0a" : "#fff" }} />
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
