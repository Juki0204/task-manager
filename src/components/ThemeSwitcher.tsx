"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const [switchDark, setSwitchDark] = useState(isDark);

  useEffect(() => {
    setSwitchDark(isDark);
  }, [isDark]);

  const handleToggle = () => {
    const nextDark = !switchDark;

    // スイッチはクリック直後に動かす
    setSwitchDark(nextDark);

    // 丸が動いたあとにテーマ変更
    window.setTimeout(() => {
      setTheme(nextDark ? "dark" : "light");
    }, 150);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {/* <span
        className={`
          text-sm
          ${!isDark
            ? "font-bold text-neutral-800 dark:text-neutral-100"
            : "text-neutral-400"
          }
        `}
      >
        Light
      </span> */}

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`テーマを${isDark ? "ライト" : "ダーク"}モードに変更`}
        onClick={handleToggle}
        className={`
          relative h-7 w-13 shrink-0 rounded-full
          border transition-colors duration-200
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-blue-500
          cursor-pointer
          ${isDark
            ? "border-neutral-900 bg-neutral-800"
            : "border-neutral-300 bg-neutral-300/50"
          }
        `}
      >
        <span
          className={`
            absolute top-1/2 left-0.5 grid place-content-center size-6
            -translate-y-1/2 rounded-full
            shadow-sm
            transition-transform duration-200
            ${switchDark ? "translate-x-5.5 bg-black" : "translate-x-0 bg-white"}
          `}
        >
          {switchDark ? (<Moon className="w-4 text-neutral-100" />) : (<Sun className="w-4 text-neutral-500" />)}
        </span>
      </button>
      {/* 
      <span
        className={`
          text-sm
          ${isDark
            ? "font-bold text-neutral-800 dark:text-neutral-100"
            : "text-neutral-400"
          }
        `}
      >
        Dark
      </span> */}
    </div>
  );
}