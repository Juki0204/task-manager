"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";

export default function FilterResetWatcher() {
  const pathname = usePathname();
  const { resetFilters } = useTaskListPreferences();

  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    const shouldReset =
      pathname === "/" ||
      pathname.startsWith("/personal") ||
      pathname.startsWith("/complete") ||
      pathname.startsWith("/trash") ||
      pathname.startsWith("/setting") ||
      pathname.startsWith("/invoice");

    if (shouldReset) {
      resetFilters();
      // console.log(`[FilterResetWatcher] reset triggered on: ${pathname}`);
    }
  }, [pathname, resetFilters]);

  return null;
}