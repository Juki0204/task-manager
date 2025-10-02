"use client";

import RequesterSetting from "@/components/settings/RequesterSetting";
// import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [activeMenu, setActiveMenu] = useState<"requester">("requester");

  return (
    <div className="cardListStyle group p-1 py-4 sm:p-4 !pt-21 max-w-[1600px] relative overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <div className="py-4 grid grid-cols-4 gap-4 w-[1568px]">

        <div className="bg-zinc-700 p-4 rounded-xl flex flex-col gap-2 min-h-[calc(100vh-9.5rem)]">
          <h2 className="font-bold text-white pl-1 border-b pb-1">設定</h2>
          <ul className="flex flex-col gap-1">
            <li className="p-2 rounded-md bg-neutral-400 font-bold">依頼者一覧</li>
          </ul>
        </div>

        <div className="bg-zinc-700 p-4 col-span-3 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]">
          {activeMenu === "requester" && <RequesterSetting></RequesterSetting>}
        </div>

      </div>
    </div>
  );
}
