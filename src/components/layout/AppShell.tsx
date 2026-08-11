"use client";

import { useState } from "react";
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
  const [isSideMenuOpen, setIsSideMenuOpen] =
    useState(true);

  const pathname = usePathname();

  const falsePathname = ["/login", "/reset", "/signup"];

  const isExcludedPath = falsePathname.some((path) => pathname.includes(path));

  const { isModalOpen } = useTask();

  return (
    <div className="min-h-svh w-full">
      <SideMenu
        isSideMenuOpen={isSideMenuOpen}
        onClick={() =>
          setIsSideMenuOpen(
            (prev) => !prev
          )
        }
      />

      <div
        className={`min-w-0 box-border transition-[padding] duration-300
          ${isSideMenuOpen ? "pl-60" : "pl-11"}
          ${isExcludedPath ? "!p-0" : ""}
          ${isModalOpen ? "pr-130" : ""}
        `}
      >
        {children}
      </div>
    </div>
  );
}