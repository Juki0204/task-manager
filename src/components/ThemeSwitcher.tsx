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
          className="rounded border px-3 py-1 text-sm text-neutral-900 dark:text-neutral-100 border-zinc-300 dark:border-zinc-700 cursor-pointer"
        >
          Light
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className="rounded border px-3 py-1 text-sm text-neutral-900 dark:text-neutral-100 border-zinc-300 dark:border-zinc-700 cursor-pointer"
        >
          Dark
        </button>

        <button
          type="button"
          onClick={() => setTheme("system")}
          className="rounded border px-3 py-1 text-sm text-neutral-900 dark:text-neutral-100 border-zinc-300 dark:border-zinc-700 cursor-pointer"
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