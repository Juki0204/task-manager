"use client";

import { useState } from "react";
import SideMenu from "@/components/SideMenu";
import { TaskProvider } from "@/components/providers/TaskProvider";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);

  const falsePathname = ['/login', '/reset', '/signup']
  const pathname = usePathname();

  const isExculedPath = falsePathname.some((path) => pathname.includes(path));

  return (
    <TaskProvider>
      <div className="min-h-svh w-full">
        <SideMenu
          isSideMenuOpen={isSideMenuOpen}
          onClick={() => setIsSideMenuOpen((prev) => !prev)}
        />

        <div
          className={`
            min-w-0 transition-[padding] duration-300 box-border
            ${isSideMenuOpen ? "pl-60" : "pl-11"}
            ${isExculedPath && "!p-0"}
          `}
        >
          {children}
        </div>
      </div>
    </TaskProvider>
  );
}