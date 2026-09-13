"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`
            rounded border px-3 py-1 text-sm text-neutral-900 dark:text-neutral-100 dark:border-zinc-700 cursor-pointer
            ${theme === "light" ? "bg-blue-200 border-blue-300" : "border-zinc-300"}
          `}
        >
          Light
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`
            rounded border px-3 py-1 text-sm text-neutral-900 dark:text-neutral-100 dark:border-zinc-700 cursor-pointer
            ${theme === "dark" ? "bg-blue-500/80 border-blue-600" : "border-zinc-300"}
          `}
        >
          Dark
        </button>

        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`
            rounded border px-3 py-1 text-sm text-neutral-900 dark:text-neutral-100 dark:border-zinc-700 cursor-pointer
            ${theme === "system" && resolvedTheme === "dark" ? "bg-blue-500/80 border-blue-600" : theme === "system" && resolvedTheme === "light" ? "bg-blue-200 border-blue-300" : "border-zinc-300"}
          `}
        >
          System
        </button>
      </div>

      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        current: {theme} / applied: {resolvedTheme}
      </span>
    </div>
  );
}