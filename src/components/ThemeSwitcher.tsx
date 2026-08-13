"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [switchDark, setSwitchDark] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    setSwitchDark(resolvedTheme === "dark");
  }, [mounted, resolvedTheme]);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="h-7 w-13 rounded-full border border-neutral-300 bg-neutral-300/50"
      />
    );
  }

  const handleToggle = () => {
    const nextDark = !switchDark;

    // スイッチはクリック直後に動かす
    setSwitchDark(nextDark);

    // スイッチの移動後にテーマを切り替える
    window.setTimeout(() => {
      setTheme(nextDark ? "dark" : "light");
    }, 200);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={switchDark}
      aria-label={`テーマを${switchDark ? "ライト" : "ダーク"}モードに変更`}
      onClick={handleToggle}
      className={`
        relative h-5.5 w-8 shrink-0 rounded-full
        border cursor-pointer
        transition-colors duration-0 delay-200
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-blue-500
        ${switchDark
          ? "border-neutral-900 bg-neutral-800"
          : "border-neutral-400/70 bg-neutral-400/50"
        }
      `}
    >
      <span
        className={`
          absolute top-1/2 left-0
          grid size-5 place-content-center
          -translate-y-1/2 rounded-full
          shadow-sm
          transition-transform duration-200 ease-out
          ${switchDark
            ? "translate-x-2.5 bg-black"
            : "translate-x-0 bg-white"
          }
        `}
      >
        {switchDark ? (
          <Moon className="w-4 text-neutral-100" />
        ) : (
          <Sun className="w-4 text-neutral-500" />
        )}
      </span>
    </button>
  );
}