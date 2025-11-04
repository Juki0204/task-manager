"use client";

import { Invoice } from "@/utils/types/invoice";
import EditableCell from "../invoice/EditableCell";
import { User } from "@/utils/types/user";

import { MdTask } from "react-icons/md";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Task } from "@/utils/types/task";
import { supabase } from "@/utils/supabase/supabase";
import InvoiceTaskDetail from "./InvoiceTaskDetail";
import EditableSelect from "./EditableSelect";

interface InvoiceListProps {
  invoices: Invoice[] | null;
  user: User;
  setInvoices: Dispatch<SetStateAction<Invoice[] | null>>;
}

interface PriceList {
  workName: string;
  price: number;
  category: string;
}

export default function InvoiceList({ invoices, user, setInvoices }: InvoiceListProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [priceList, setPriceList] = useState<string[] | null>(null);
  const [activeCell, setActiveCell] = useState<{ recordId: string; field: string; } | null>(null);

  const handleActiveTask = async (id: string) => {
    const { data: task, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) console.log(error);
    setActiveTask(task);
  }

  const getPrices = async () => {
    const { data: prices } = await supabase
      .from("prices")
      .select("*");

    if (!prices) return;
    const formatPrices: string[] = [];
    prices.forEach(p => {
      formatPrices.push(p.work_name);
    });
    setPriceList(formatPrices);
    console.log(
      formatPrices
    )
  }

  useEffect(() => {
    getPrices();
  }, []);

  return (
    <div onClick={() => setActiveCell(null)} className="relative text-white whitespace-nowrap w-[2500px] box-border">
      <div className="grid grid-cols-[40px_90px_240px_240px_auto_100px_100px_100px_100px_180px_50px_60px_100px_80px_100px_500px] items-center text-sm text-center text-neutral-950 font-bold">
        <div className="border border-neutral-700 p-1 bg-neutral-100 sticky left-0">確認</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100 sticky left-10 z-20">No.</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100 sticky left-32.5 z-20">クライアント</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100 sticky left-92.5 z-20">作業タイトル</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100 sticky left-152.5 z-20">作業内容</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">完了日</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">担当者</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">大カテゴリ</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">中カテゴリ</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">小カテゴリ</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">点数</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">修正度</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">仮請求額</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">修正金額</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">本請求額</div>
        <div className="border border-l-0 border-neutral-700 p-1 bg-neutral-100">備考欄</div>
      </div>
      {invoices &&
        invoices.map((i, index) => (
          <div key={i.id} className="grid grid-cols-[40px_90px_240px_240px_auto_100px_100px_100px_100px_180px_50px_60px_100px_80px_100px_500px] items-center border-neutral-700 text-sm">
            <div className={`grid place-content-center border border-t-0 border-neutral-700 min-h-9 p-2 sticky left-0 z-20 hover:bg-neutral-700 ${index % 2 === 1 ? "bg-neutral-900" : "bg-neutral-800"}`}><MdTask onClick={() => { handleActiveTask(i.id); setIsOpen(true) }} className="text-xl" /></div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 sticky left-10 z-20 text-center ${index % 2 === 1 ? "bg-slate-900" : "bg-slate-800"}`}>{i.serial}</div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 sticky left-32.5 z-20 ${index % 2 === 1 ? "bg-slate-900" : "bg-slate-800"}`}>{i.client}《{i.requester}》</div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 sticky left-92.5 z-20 ${index % 2 === 1 ? "bg-neutral-900" : "bg-neutral-800"}`}>
              <EditableCell
                recordId={i.id}
                field="title"
                value={i.title}
                user={user}
                setInvoices={setInvoices}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
              />
            </div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 sticky left-152.5 z-20 ${index % 2 === 1 ? "bg-neutral-900" : "bg-neutral-800"}`}>
              <EditableCell
                recordId={i.id}
                field="description"
                value={i.description}
                user={user}
                setInvoices={setInvoices}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
              />
            </div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-center ${index % 2 === 1 ? "bg-slate-900" : "bg-slate-800"}`}>{i.finish_date ?? "-"}</div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-center ${index % 2 === 1 ? "bg-slate-900" : "bg-slate-800"}`}>{i.manager}</div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-center ${index % 2 === 1 ? "bg-slate-900" : "bg-slate-800"}`}>{i.category ?? "-"}</div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 text-center ${index % 2 === 1 ? "bg-neutral-900" : "bg-neutral-800"}`}>
              <EditableSelect
                recordId={i.id}
                field="device"
                value={i.device ?? ""}
                user={user}
                options={["PC", "スマホ", "レスポンシブ", "会員サイト"]}
                setInvoices={setInvoices}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
              />
            </div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 overflow-hidden ${index % 2 === 1 ? "bg-neutral-900" : "bg-neutral-800"}`}>
              <EditableSelect
                recordId={i.id}
                field="work_name"
                value={i.work_name ?? ""}
                user={user}
                options={priceList ?? []}
                setInvoices={setInvoices}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
              />
            </div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 ${index % 2 === 1 ? "bg-neutral-900" : "bg-neutral-800"}`}>
              <EditableCell
                className="text-center"
                recordId={i.id}
                field="pieces"
                type="tel"
                value={i.pieces ?? ""}
                user={user}
                setInvoices={setInvoices}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
              />
            </div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 ${index % 2 === 1 ? "bg-neutral-900" : "bg-neutral-800"}`}>
              <EditableSelect
                recordId={i.id}
                field="degree"
                value={i.degree ?? ""}
                user={user}
                options={["50", "80", "100", "120"]}
                className="text-right"
                setInvoices={setInvoices}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
              />
            </div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-right ${index % 2 === 1 ? "bg-slate-900" : "bg-slate-800"}`}>{i.amount ?? "-"}</div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 ${index % 2 === 1 ? "bg-neutral-900" : "bg-neutral-800"}`}>
              <EditableCell
                className="text-right"
                recordId={i.id}
                field="adjustment"
                type="tel"
                value={i.adjustment ?? 0}
                user={user}
                setInvoices={setInvoices}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
              />
            </div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 p-2 text-right ${index % 2 === 1 ? "bg-slate-900" : "bg-slate-800"}`}>{i.total_amount ?? "-"}</div>
            <div className={`border border-l-0 border-t-0 border-neutral-700 min-h-9 ${index % 2 === 1 ? "bg-neutral-900" : "bg-neutral-800"}`}>
              <EditableCell
                recordId={i.id}
                field="remarks"
                value={i.remarks ?? ""}
                user={user}
                setInvoices={setInvoices}
                activeCell={activeCell}
                setActiveCell={setActiveCell}
              />
            </div>
          </div>
        )
        )}

      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setTimeout(() => {
            setActiveTask(null);
          }, 10);
        }}
        // transition
        className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative min-w-sm max-w-xl space-y-4 rounded-2xl bg-neutral-100 p-8 pr-6">
            {activeTask && user && (
              <InvoiceTaskDetail
                task={activeTask}
                onClose={() => { setIsOpen(false); setActiveTask(null); }}
              />
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}