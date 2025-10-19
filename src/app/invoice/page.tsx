"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { Invoice } from "@/utils/types/invoice";

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const { user } = useAuth();

  const [currentMonth, setCurrentMonth] = useState<string>((new Date().getMonth() + 1).toLocaleString("ja-JP"));

  const getInvoice = async () => {
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoice')
      .select('*');

    if (invoiceError) {
      console.error('Failed to select invoice:', invoiceError);
    } else {
      setInvoices(invoiceData);
    }
  }

  useEffect(() => {
    getInvoice();
  }, []);

  return (
    <div className="p-1 py-4 sm:p-4 !pt-30 relative overflow-x-hidden">
      <h2 className="p-1 pb-4 text-white text-xl font-bold text-center">{currentMonth}月度請求一覧</h2>
      <div className="pb-2 overflow-x-scroll [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-600">
        <ul className="relative text-white whitespace-nowrap w-[2500px] box-border">
          <li className="grid grid-cols-[80px_240px_240px_auto_100px_100px_100px_100px_160px_50px_60px_100px_100px_100px_500px] items-center text-sm text-center text-neutral-950 font-bold">
            <p className="border border-neutral-700 p-1 bg-neutral-100 sticky left-0">No.</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100 sticky left-20">クライアント</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100 sticky left-80">作業タイトル</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">作業内容</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">完了日</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">担当者</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">大カテゴリ</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">中カテゴリ</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">小カテゴリ</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">点数</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">修正度</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">仮請求額</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">修正金額</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">本請求額</p>
            <p className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">備考欄</p>
          </li>
          {invoices &&
            invoices.map((i) => (
              <li key={i.id} className="grid grid-cols-[80px_240px_240px_auto_100px_100px_100px_100px_160px_50px_60px_100px_100px_100px_500px] items-center border-neutral-700 text-sm">
                <p className="border border-t-0 border-neutral-700 p-1 bg-neutral-900 sticky left-0 text-center">{i.serial}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900 sticky left-20">{i.client}《{i.requester}》</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900 sticky left-80">{i.title}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900">{i.description}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900 text-center">{i.finish_date ?? "-"}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900 text-center">{i.manager}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900">{i.category ?? "-"}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900">{i.device ?? "-"}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900">{i.work_name ?? "-"}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900 text-right">{i.pieces ?? "-"}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900 text-right">{i.degree ?? "-"}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900 text-right">{i.amount ?? "-"}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900 text-right">{i.adjustment ?? "-"}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900 text-right">{i.total_amount ?? "-"}</p>
                <p className="border border-l-0 border-t-0 border-neutral-700 p-1 bg-neutral-900">{i.remarks ?? "-"}</p>
              </li>
            ))}
        </ul>
      </div>
    </div >
  );
}
