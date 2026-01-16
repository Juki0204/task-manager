"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { Invoice } from "@/utils/types/invoice";
import InvoiceList from "@/components/invoice/InvoiceList";
import { Button, Input, Select } from "@headlessui/react";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";

import { FaSearch } from "react-icons/fa";
import { LuDownload } from "react-icons/lu";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";


export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const { user } = useAuth();

  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 1);
  const [currentYear, setCurrentYear] = useState<string>(String(baseDate.getFullYear()));
  const [currentMonth, setCurrentMonth] = useState<string>(String(baseDate.getMonth() + 1));

  const { invoiceSortState, setInvoiceSortState, filters, setFilters } = useTaskListPreferences();
  const [filteredInvoices, setFiteredInvoices] = useState<Invoice[] | null>(null);

  const [totalInvoices, setTotalInvoices] = useState<{
    web: number,
    dtp: number,
    print: number,
    other: number,
    taskCount: number,
    unclaimed: number,
    claimed: number,
    amount: number,
    adjustment: number,
    totalAmount: number,
  }>
    ({
      web: 0,
      dtp: 0,
      print: 0,
      other: 0,
      taskCount: 0,
      unclaimed: 0,
      claimed: 0,
      amount: 0,
      adjustment: 0,
      totalAmount: 0,
    });

  const [totalClients, setTotalClients] = useState<{
    nmb: number,
    sno: number,
    tnm: number,
    tng: number,
    umd: number,
    umg: number,
    nks: number,
    tmr: number,
    oks: number,
  }>({
    nmb: 0,
    sno: 0,
    tnm: 0,
    tng: 0,
    umd: 0,
    umg: 0,
    nks: 0,
    tmr: 0,
    oks: 0,
  })

  const filteringInvoices = (invoices: Invoice[] | null) => {
    if (!invoices) return null;

    const sorted = (() => {
      const copy = [...invoices];

      switch (invoiceSortState) {
        case "byDate":
          return copy.sort((a, b) => new Date(a.finish_date).getTime() - new Date(b.finish_date).getTime());

        case "byClient":
          return copy.sort((a, b) => a.client.localeCompare(b.client, "ja"));

        case "byClientRev":
          return copy.sort((a, b) => b.client.localeCompare(a.client, "ja"));

        default:
          return copy;
      }
    })();

    const keyword = filters.searchKeywords?.toLowerCase() ?? null;

    const filtered = sorted.filter((i) => {
      //クライアント
      const clientMatch =
        filters.clients.length === 0 || filters.clients.includes(i.client);

      //作業担当者
      const assigneeMatch =
        filters.assignees.length === 0 || filters.assignees.includes(i.manager);

      //キーワード検索
      const searchMatch =
        !keyword ||
        i.serial?.toLowerCase().includes(keyword) ||
        i.title?.toLowerCase().includes(keyword) ||
        i.description?.toLowerCase().includes(keyword) ||
        i.requester?.toLowerCase().includes(keyword);

      return clientMatch && assigneeMatch && searchMatch;
    });

    return filtered;
  };

  //invoice一覧取得
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
      setFiteredInvoices(sortInvoiceData);
      //console.log(invoiceData);
    }
  }

  const calcTotalInvoices = (invoices: Invoice[] | null) => {
    if (!invoices) return;

    const targetInvoices =
      filters.assignees && filters.assignees.length > 0
        ? invoices.filter(i => filters.assignees.includes(i.manager)) //担当者で絞り込み
        : invoices; //フィルタなしなら全件

    let amo: number = 0;
    let adj: number = 0;
    let totalAmo: number = 0;

    targetInvoices.forEach(i => {
      amo = amo + (i.amount ? i.amount : 0);
      adj = adj + (i.adjustment ? i.adjustment : 0);
      totalAmo = totalAmo + (i.total_amount ? i.total_amount : 0);
    });

    setTotalInvoices({
      web: targetInvoices.filter(i => i.category === "WEB").length,
      dtp: targetInvoices.filter(i => i.category === "印刷").length,
      print: targetInvoices.filter(i => i.category === "出力").length,
      other: targetInvoices.filter(i => i.category === "その他").length,
      taskCount: targetInvoices.length,
      unclaimed: targetInvoices.filter(i => i.total_amount === 0 || i.total_amount === null).length,
      claimed: targetInvoices.filter(i => i.total_amount !== 0 && i.total_amount !== null).length,
      amount: amo,
      adjustment: adj,
      totalAmount: totalAmo,
    });
  }

  const calcInvoiceClients = (invoices: Invoice[] | null) => {
    if (!invoices) return;

    const targetInvoices =
      filters.assignees && filters.assignees.length > 0
        ? invoices.filter(i => filters.assignees.includes(i.manager)) //担当者で絞り込み
        : invoices; //フィルタなしなら全件

    setTotalClients({
      nmb: targetInvoices.filter(i => i.serial.includes("NMB")).length,
      sno: targetInvoices.filter(i => i.serial.includes("SNO")).length,
      tnm: targetInvoices.filter(i => i.serial.includes("TNM")).length,
      tng: targetInvoices.filter(i => i.serial.includes("TNG")).length,
      umd: targetInvoices.filter(i => i.serial.includes("UMD")).length,
      umg: targetInvoices.filter(i => i.serial.includes("UMG")).length,
      nks: targetInvoices.filter(i => i.serial.includes("NKS")).length,
      tmr: targetInvoices.filter(i => i.serial.includes("TMR")).length,
      oks: targetInvoices.filter(i => i.serial.includes("OKS")).length,
    })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function downloadInvoice(invoices: Invoice[], mode: "invoice" | "processing") {
    const res = await fetch("/api/export-invoice", {
      method: "POST",
      body: JSON.stringify({
        invoices,
        mode: mode,
      }),
    });

    const disposition = res.headers.get("Content-Disposition");
    let filename = "invoice.xlsx"; //デフォルトor名前がない場合

    if (disposition) {
      //日本語ファイル名をデコード
      const filenameStarMatch = disposition.match(/filename\*=UTF-8''(.+)/);
      if (filenameStarMatch && filenameStarMatch[1]) {
        filename = decodeURIComponent(filenameStarMatch[1]);
      } else {
        //英数字のみの場合はそのまま
        const filenameMatch = disposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  const [invoiceDL, setInvoiceDL] = useState(false);
  const [processingDL, setProcessingDL] = useState<boolean>(false);

  async function handleDownload(type: "invoice" | "processing") {
    if (!filteredInvoices) return;
    try {
      if (type === "invoice") {
        setInvoiceDL(true);
        await downloadInvoice(filteredInvoices, "invoice");
      }
      if (type === "processing") {
        setProcessingDL(true);
        await downloadInvoice(filteredInvoices, "processing");
      }
    } finally {
      if (type === "invoice") {
        setInvoiceDL(false);
      }
      if (type === "processing") {
        setProcessingDL(false);
      }
    }
  }

  useEffect(() => {
    calcTotalInvoices(invoices);
    calcInvoiceClients(invoices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, filters.assignees]);

  useEffect(() => {
    console.log(currentYear, currentMonth);
    getInvoice(currentYear, currentMonth);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    setFiteredInvoices(filteringInvoices(invoices));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceSortState, filters, invoices]);

  return (
    <div className="p-1 py-4 sm:p-4 sm:pb-2 !pt-26 relative overflow-x-hidden min-h-[80svh]">
      <div className="flex justify-between gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-700 min-w-375">
        <div className="flex justify-start items-end gap-4">
          <h2 className="flex justify-center items-center gap-1 text-white text-xl font-bold text-center">
            <Select value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} className="bg-neutral-700 rounded-md px-2 pt-0.5 pb-0.75">
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </Select>
            年
            <Select value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="bg-neutral-700 rounded-md px-2 pt-0.5 pb-0.75">
              <option value="01">1</option>
              <option value="02">2</option>
              <option value="03">3</option>
              <option value="04">4</option>
              <option value="05">5</option>
              <option value="06">6</option>
              <option value="07">7</option>
              <option value="08">8</option>
              <option value="09">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </Select>
            月度 請求一覧
          </h2>
        </div>

        <div className="flex gap-2">
          <Button
            disabled={invoiceDL}
            onClick={() => {
              handleDownload("invoice");
            }}
            className={`py-2 flex items-center gap-1 rounded pl-3.5 pr-4.5 text-sm text-white font-bold data-hover:opacity-80 data-hover:cursor-pointer ${invoiceDL ? "bg-neutral-500 pointer-events-none" : "bg-purple-500/50"}`}
          >
            <LuDownload />
            {invoiceDL ? (
              <span>処理中...</span>
            ) : (
              <span>当月請求データ</span>
            )}
          </Button>
          <Button
            disabled={processingDL}
            onClick={() => {
              handleDownload("processing");
            }}
            className={`py-2 flex items-center gap-1 rounded pl-3.5 pr-4.5 text-sm text-white font-bold data-hover:opacity-80 data-hover:cursor-pointer ${processingDL ? "bg-neutral-500 pointer-events-none" : "bg-purple-500/50"}`}
          >
            <LuDownload />
            {processingDL ? (
              <span>処理中...</span>
            ) : (
              <span>請求書加工用データ</span>
            )}
          </Button>
        </div>
      </div>

      <div className="scroll-container p-1 pb-2 overflow-x-scroll [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">

        {user &&
          (filteredInvoices && filteredInvoices.length > 0 ? (
            <InvoiceList setInvoices={setInvoices} invoices={filteredInvoices} sortState={invoiceSortState} user={user} />
          ) : (
            <>
              <InvoiceList setInvoices={setInvoices} invoices={filteredInvoices} sortState={invoiceSortState} user={user} />
              <p className="text-white text-center my-5">請求するタスクがありません</p>
            </>
          ))}
      </div>

      <div className="w-fit mr-auto ml-auto mt-3 mb-5">
        <div className="w-430 grid grid-cols-27 items-center text-sm text-center text-neutral-950 font-bold">
          <div className="border col-span-1 border-neutral-700 p-1 bg-neutral-100">難波</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100">新大阪</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100">谷町</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100">谷町G</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100">梅田</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100">梅田G</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100">中洲</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100">玉乱堂</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100 mr-1">奥様</div>

          <div className="border col-span-1 border-neutral-700 p-1 bg-neutral-100">WEB</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100">印刷</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100">出力</div>
          <div className="border col-span-1 border-l-0 border-neutral-700 p-1 bg-neutral-100 mr-1">その他</div>

          <div className="border col-span-2 border-neutral-700 p-1 bg-neutral-100">総作業件数</div>
          <div className="border col-span-2 border-l-0 border-neutral-700 p-1 bg-red-100">未請求件数</div>
          <div className="border col-span-2 border-l-0 border-neutral-700 p-1 bg-neutral-100 mr-1">請求件数</div>

          <div className="border col-span-3 border-neutral-700 p-1 bg-neutral-100">仮請求額</div>
          <div className="border col-span-2 border-l-0 border-neutral-700 p-1 bg-neutral-100">調整額</div>
          <div className="border col-span-3 border-l-0 border-neutral-700 p-1 bg-blue-100">本請求額</div>
        </div>
        <div className="w-430 grid grid-cols-27 items-center border-neutral-700 text-sm tracking-wider">
          <div className="border col-span-1 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalClients.nmb}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalClients.sno}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalClients.tnm}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalClients.tng}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalClients.umd}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalClients.umg}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalClients.nks}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalClients.tmr}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right mr-1">{totalClients.oks}件</div>

          <div className="border col-span-1 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalInvoices.web}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalInvoices.dtp}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalInvoices.print}件</div>
          <div className="border col-span-1 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right mr-1">{totalInvoices.other}件</div>

          <div className="border col-span-2 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalInvoices.taskCount}件</div>
          <div className="border col-span-2 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right">{totalInvoices.unclaimed}件</div>
          <div className="border col-span-2 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right mr-1">{totalInvoices.claimed}件</div>

          <div className="border col-span-3 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right font-bold">{totalInvoices.amount.toLocaleString()}円</div>
          <div className={`border col-span-2 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-right font-bold ${totalInvoices.adjustment < 0 ? "text-red-400" : "text-white"}`}>{totalInvoices.adjustment.toLocaleString()}円</div>
          <div className="border col-span-3 border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-white text-right font-bold">{totalInvoices.totalAmount.toLocaleString()}円</div>
        </div>
      </div>
    </div>
  );
}
