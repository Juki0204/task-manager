"use client";

import RequesterSetting from "@/components/settings/RequesterSetting";
import PriceSetting from "@/components/settings/PriceSetting";
import { useState } from "react";
// import Image from "next/image";
// import { useState } from "react";

type ActiveMenu = "requester" | "invoicePrice";

export default function SettingPage() {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>("requester");

  return (
    <div className="cardListStyle group p-1 py-4 sm:p-4 !pt-30 max-w-[1600px] relative overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <div className="py-4 grid grid-cols-4 gap-4 w-[1568px]">

        <div className="bg-zinc-700 p-4 rounded-xl flex flex-col gap-2 min-h-[calc(100vh-9.5rem)]">
          <h2 className="font-bold text-white pl-1 border-b pb-1">タスク管理設定</h2>
          <ul className="flex flex-col gap-1 mb-4">
            <li onClick={() => setActiveMenu("requester")} className={`p-2 rounded-md font-bold ${activeMenu === "requester" ? "bg-white" : "bg-neutral-400 cursor-pointer"}`}>依頼者一覧</li>
          </ul>

          <h2 className="font-bold text-white pl-1 border-b pb-1">請求管理設定</h2>
          <ul className="flex flex-col gap-1">
            <li onClick={() => setActiveMenu("invoicePrice")} className={`p-2 rounded-md font-bold ${activeMenu === "invoicePrice" ? "bg-white" : "bg-neutral-400 cursor-pointer"}`}>請求単価一覧</li>
          </ul>
        </div>

        <div className="bg-zinc-700 p-4 col-span-3 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]">
          {activeMenu === "requester" && <RequesterSetting />}
          {activeMenu === "invoicePrice" && <PriceSetting />}
        </div>

      </div>
    </div>
  );
}
