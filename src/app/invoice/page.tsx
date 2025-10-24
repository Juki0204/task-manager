"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { Invoice } from "@/utils/types/invoice";
import InvoiceList from "@/components/invoice/InvoiceList";

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
      const sortInvoiceData = invoiceData.sort((a, b) => {
        return new Date(a.finish_date).getTime() - new Date(b.finish_date).getTime();
      })
      setInvoices(sortInvoiceData);
      console.log(invoiceData);
    }
  }

  useEffect(() => {
    getInvoice();

    // Realtime購読（行追加・更新）
    const channel = supabase
      .channel("invoice")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoice" },
        (payload) => {
          setInvoices((prev): Invoice[] | null => {
            if (!prev) return null;

            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as Invoice];
            }

            if (payload.eventType === "UPDATE") {
              return prev.map((inv) => inv.id === payload.new.id ? (payload.new as Invoice) : inv);
            }

            if (payload.eventType === "DELETE") {
              return prev.filter((inv) => inv.id !== payload.old.id);
            }

            return prev;
          })
          getInvoice(); // シンプルに再取得（最初はこれでOK）
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, []);

  // useEffect(() => {
  //   getInvoice();
  // }, []);

  return (
    <div className="p-1 py-4 sm:p-4 !pt-30 relative overflow-x-hidden">
      <h2 className="p-1 pb-4 text-white text-xl font-bold text-center">{currentMonth}月度請求一覧</h2>
      <div className="pb-2 overflow-x-scroll [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
        {user && <InvoiceList invoices={invoices} user={user} />}
      </div>
    </div >
  );
}
