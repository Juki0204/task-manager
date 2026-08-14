"use client";

import { usePathname } from "next/navigation";

import SideMenu from "@/components/SideMenu";
import { TaskProvider, useTask } from "@/components/providers/TaskProvider";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <TaskProvider>
      <AppShellInner>
        {children}
      </AppShellInner>
    </TaskProvider>
  );
}

function AppShellInner({ children }: AppShellProps) {
  const pathname = usePathname();

  const falsePathname = ["/login", "/reset", "/signup"];

  const isExcludedPath = falsePathname.some((path) => pathname.includes(path));

  const { isPanelOpen } = useTask();

  return (
    <div className="min-h-svh w-full">
      <SideMenu />

      <div
        className={`min-w-0 box-border transition-[padding] duration-300 pl-11
          ${isExcludedPath ? "!p-0" : ""}
          ${isPanelOpen ? "pr-130" : ""}
        `}
      >
        {children}
      </div>
    </div>
  );
}