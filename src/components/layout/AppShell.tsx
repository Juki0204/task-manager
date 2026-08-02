"use client";

import { useState } from "react";
import SideMenu from "@/components/SideMenu";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);

  return (
    <div className="min-h-svh w-full">
      <SideMenu
        isSideMenuOpen={isSideMenuOpen}
        onClick={() => setIsSideMenuOpen((prev) => !prev)}
      />

      <div
        className={`
          min-w-0 transition-[padding] duration-300 box-border
          ${isSideMenuOpen ? "pl-60" : "pl-11"}
        `}
      >
        {children}
      </div>
    </div>
  );
}