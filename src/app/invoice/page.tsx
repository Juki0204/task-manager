"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { Invoice } from "@/utils/types/invoice";
import InvoiceList from "@/components/invoice/InvoiceList";
import { Select } from "@headlessui/react";

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const { user } = useAuth();

  const [currentYear, setCurrentYear] = useState<string>(String(new Date().getFullYear()));
  const [currentMonth, setCurrentMonth] = useState<string>(String(new Date().getMonth()));

  const getInvoice = async (year: string, month: string) => {
    const fromDate = `${year}-${month}-01`;
    const toDate = `${year}-${month}-31`;

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoice')
      .select('*')
      .gte("finish_date", fromDate)
      .lte("finish_date", toDate);

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
    getInvoice(currentYear, currentMonth);

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
          // getInvoice();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, []);

  useEffect(() => {
    getInvoice(currentYear, currentMonth);
  }, [currentMonth, currentYear]);

  return (
    <div className="p-1 py-4 sm:p-4 sm:pb-20 !pt-30 relative overflow-x-hidden">
      <h2 className="flex justify-center items-center gap-1 p-1 pb-4 text-white text-xl font-bold text-center">
        <Select value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} className="bg-neutral-700 rounded-md px-2 py-1">
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </Select>
        年
        <Select value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="bg-neutral-700 rounded-md px-2 py-1">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
        </Select>
        月度 請求一覧
      </h2>
      <div className="pb-2 overflow-x-scroll [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
        {user && invoices && invoices.length > 0 ? (
          <InvoiceList setInvoices={setInvoices} invoices={invoices} user={user} />
        ) : (
          <p className="text-white text-center my-5">請求するタスクがありません</p>
        )}
      </div>
    </div >
  );
}
