"use client";

import { Invoice } from "@/utils/types/invoice";
import EditableCell from "../invoice/EditableCell";
import EditableSelect from "../invoice/EditableSelect";
import { User } from "@/utils/types/user";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Task } from "@/utils/types/task";
import { supabase } from "@/utils/supabase/supabase";
import InvoiceTaskDetail from "./InvoiceTaskDetail";
import EditableCombobox from "./EditableCombobox";
import EditableTextarea from "./EditableTextarea";

import { FaSortAmountDown, FaSortAmountDownAlt } from "react-icons/fa";
import { MdTask } from "react-icons/md";
import { PiNotePencilBold } from "react-icons/pi";


import AllEditableForm from "./AllEditableForm";
import ToggleRowNumber from "./ToggleRowNumber";
import { InvoiceEditingProvider } from "./InvoiceEditingProvider";


interface InvoiceListProps {
  invoices: Invoice[] | null;
  user: User;
  setInvoices: Dispatch<SetStateAction<Invoice[] | null>>;
  sortState: string;
}

// COLUMNS定義（右左移動に使う）
const FIELDS = [
  "title", "description", "finish_date", "media", "work_name",
  "pieces", "degree", "adjustment", "remarks",
] as const;

type FieldName = (typeof FIELDS)[number];

export default function InvoiceList({ invoices, user, setInvoices, sortState }: InvoiceListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTaskLoaded, setIsTaskLoaded] = useState<boolean>(false);
  const [isAllEditableFromOpen, setIsAllEditableFromOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [priceList, setPriceList] = useState<string[] | null>(null);
  const [allPriceList, setAllPriceList] = useState<{ id: number, category: string, sub_category: string, work_name: string, price: number }[] | null>(null);
  const [activeCell, setActiveCell] = useState<{ recordId: string, field: string } | null>(null);
  const [activeRecord, setActiveRecord] = useState<{ currentId: string | null, prevId: string | null, nextId: string | null } | null>(null)

  const handleActiveRecord = (recordId: string | null) => {
    if (!recordId) return;

    const siblingIsd = getSiblingInvoices(recordId);
    setActiveRecord({ currentId: recordId, prevId: siblingIsd.prev, nextId: siblingIsd.next });
  }

  function getSiblingInvoices(targetId: string) {
    if (!invoices) return { prev: null, next: null };

    const index = invoices.findIndex(i => i.id === targetId);
    if (index === -1) return { prev: null, next: null };

    return {
      prev: index > 0 ? invoices[index - 1].id : null,
      next: index < invoices.length - 1 ? invoices[index + 1].id : null,
    };
  }

  // 親でrefレジストリを保持（ロービング tabindex 用）
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const registerCellRef = (id: string, field: string, el: HTMLDivElement | null) => {
    const key = `${id}::${field}`;
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  };

  // アクティブセル変更時に自動フォーカス
  useEffect(() => {
    if (!activeCell) return;
    const key = `${activeCell.recordId}::${activeCell.field}`;
    const el = cellRefs.current.get(key);
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeCell]);

  // タスク詳細モーダル開く
  const handleActiveTask = async (id: string) => {
    const { data: task } = await supabase.from("tasks").select("*").eq("id", id).single();
    if (task) setActiveTask(task);

    setIsTaskLoaded(true);
  };

  // 価格一覧を取得
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("prices").select("*");
      if (!data) return;
      setPriceList(data.map((p) => p.work_name).sort((a, b) => a.localeCompare(b, "ja")));
      setAllPriceList(data.map((p) => ({
        id: p.id,
        category: p.category,
        sub_category: p.sub_category,
        work_name: p.work_name,
        price: p.price,
      })));
    })();
  }, []);

  // ナビゲーション処理
  const handleKeyNavigation = (dir: "up" | "down" | "left" | "right") => {
    if (!activeCell || !invoices) return;

    const rowIndex = invoices.findIndex((i) => i.id === activeCell.recordId);
    const colIndex = FIELDS.indexOf(activeCell.field as FieldName);
    if (rowIndex === -1 || colIndex === -1) return;

    let nextRow = rowIndex;
    let nextCol = colIndex;

    switch (dir) {
      case "up":
        nextRow = Math.max(0, rowIndex - 1);
        break;
      case "down":
        nextRow = Math.min(invoices.length - 1, rowIndex + 1);
        break;
      case "left":
        nextCol = Math.max(0, colIndex - 1);
        break;
      case "right":
        nextCol = Math.min(FIELDS.length - 1, colIndex + 1);
        break;
    }

    setActiveCell({ recordId: invoices[nextRow].id, field: FIELDS[nextCol] });
  };

  useEffect(() => {
    if (!activeCell) return;

    const activeEl = document.querySelector(
      `[data-record-id="${activeCell.recordId}"][data-field="${activeCell.field}"]`
    ) as HTMLElement | null;
    //console.log(activeEl);

    const standardEl = document.getElementById("standardPosition");
    const scrollContainer = document.querySelector(".scroll-container");

    if (!activeEl || !standardEl || !scrollContainer) return;

    const activeRect = activeEl.getBoundingClientRect();
    const standardRect = standardEl.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();

    // 「作業内容」右端より左にある（＝見切れてる）
    if (activeRect.left < standardRect.right) {
      const diff = standardRect.right - activeRect.left;
      scrollContainer.scrollLeft -= diff + 10; // +10 は余白
    }

    // 逆に右端に行きすぎた場合（オプション）
    if (activeRect.right > containerRect.right) {
      scrollContainer.scrollLeft += activeRect.right - containerRect.right + 10;
    }
  }, [activeCell]);


  const toggleChecked = async (id: string, next: boolean) => {
    setInvoices((prev) =>
      prev && prev.map((i) => (i.id === id ? { ...i, checked: next } : i))
    );

    const { error } = await supabase
      .from("invoice")
      .update({ checked: next })
      .eq("id", id);

    if (error) {
      setInvoices((prev) =>
        prev && prev.map((i) => (i.id === id ? { ...i, checked: !next } : i))
      );
    }
  };

  return (
    <InvoiceEditingProvider>
      <div onClick={() => setActiveCell(null)} className="relative text-white whitespace-nowrap w-[2520px] box-border">
        <div className="grid grid-cols-[40px_40px_40px_200px_240px_auto_120px_80px_80px_100px_180px_50px_60px_100px_80px_100px_500px] items-center text-[13px] text-center text-neutral-950 font-bold">
          <div className="border border-neutral-600 p-1 bg-neutral-100 sticky left-0 z-20">行番</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100 sticky left-10 z-20">一括</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100 sticky left-20 z-20">確認</div>
          <div className={`border border-l-0 border-neutral-600 p-1 sticky left-30 z-20 ${sortState === "byClient" || sortState === "byClientRev" ? "bg-amber-100 relative" : "bg-neutral-100"}`}>
            クライアント
            {sortState === "byClient" && <FaSortAmountDownAlt className="absolute top-1/2 -translate-y-1/2 right-2" />}
            {sortState === "byClientRev" && <FaSortAmountDown className="absolute top-1/2 -translate-y-1/2 right-2" />}
          </div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100 sticky left-80 z-20">作業タイトル</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100 sticky left-140 z-20" id="standardPosition">作業内容</div>
          <div className={`border border-l-0 border-neutral-600 p-1 ${sortState === "byDate" ? "bg-amber-100 relative" : "bg-neutral-100"}`}>
            完了日 {sortState === "byDate" && <FaSortAmountDownAlt className="absolute top-1/2 -translate-y-1/2 right-2" />}
          </div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">担当者</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">大カテゴリ</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">中カテゴリ</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">小カテゴリ</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">点数</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">修正度</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">仮請求額</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">修正金額</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">本請求額</div>
          <div className="border border-l-0 border-neutral-600 p-1 bg-neutral-100">備考欄</div>
        </div>
        {invoices &&
          invoices.map((i, index) => (
            <div key={i.id} className="grid grid-cols-[40px_40px_40px_200px_240px_auto_120px_80px_80px_100px_180px_50px_60px_100px_80px_100px_500px] items-center border-neutral-600 text-[13px]">
              <div
                className={`
                flex items-center justify-center border border-t-0 border-neutral-600 min-h-8 h-full sticky left-0 z-20
                ${index % 2 === 1 ? "bg-slate-800" : "bg-[#2e3b4d]"}
              `}
              >
                <ToggleRowNumber item={i} index={index} onToggle={toggleChecked} />
              </div>
              <div
                onClick={() => {
                  const prevId = index > 0 ? invoices[index - 1].id : null;
                  const nextId = index < invoices.length - 1 ? invoices[index + 1].id : null;

                  handleActiveRecord(i.id);
                  setIsAllEditableFromOpen(true);
                }}
                className={`
                grid place-content-center border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full py-1.5 px-2 sticky left-10 z-20 hover:bg-neutral-600
                ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}
                ${activeRecord?.currentId === i.id ? "!bg-yellow-300 text-black" : ""}
              `}
              >
                <PiNotePencilBold className="text-lg" />
              </div>
              <div
                className={`
                flex items-center justify-center border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full py-1.5 px-2 sticky left-20 z-20 cursor-pointer
                ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}
              `}
                onClick={() => { handleActiveTask(i.id); setIsOpen(true) }}
              >
                <MdTask className="text-lg" />
                {/* {i.serial} */}
              </div>
              <div className={`flex items-center border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full py-1.5 px-2 sticky left-30 z-20 ${index % 2 === 1 ? "bg-slate-800" : "bg-[#2e3b4d]"}`}>{i.client} 【{i.requester}】</div>
              <div className={`border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full sticky left-80 z-20 ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}`}>
                <EditableCell
                  recordId={i.id}
                  field="title"
                  value={i.title}
                  user={user}
                  className="whitespace-pre-wrap"
                  setInvoices={setInvoices}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                  handleKeyNavigation={handleKeyNavigation}
                  registerCellRef={registerCellRef}
                />
              </div>
              <div className={`border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full sticky left-140 z-20 ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}`}>
                <EditableCell
                  recordId={i.id}
                  field="description"
                  value={i.description}
                  user={user}
                  className="whitespace-pre-wrap"
                  setInvoices={setInvoices}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                  handleKeyNavigation={handleKeyNavigation}
                  registerCellRef={registerCellRef}
                />
              </div>
              <div className={`border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full text-center ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}`}>
                <EditableCell
                  recordId={i.id}
                  field="finish_date"
                  value={i.finish_date}
                  user={user}
                  type="date"
                  className="justify-center"
                  setInvoices={setInvoices}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                  handleKeyNavigation={handleKeyNavigation}
                  registerCellRef={registerCellRef}
                />
              </div>
              <div className={`flex items-center justify-center border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full py-1.5 px-2 text-center ${index % 2 === 1 ? "bg-slate-800" : "bg-[#2e3b4d]"}`}>{i.manager}</div>
              <div className={`flex items-center justify-center border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full py-1.5 px-2 text-center ${index % 2 === 1 ? "bg-slate-800" : "bg-[#2e3b4d]"}`}>{i.category ?? "-"}</div>
              <div className={`border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full text-center ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}`}>
                <EditableSelect
                  recordId={i.id}
                  field="media"
                  value={i.media ?? ""}
                  user={user}
                  options={["営業", "求人", "受付", "会員", "その他"]}
                  className="justify-center"
                  setInvoices={setInvoices}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                  handleKeyNavigation={handleKeyNavigation}
                  registerCellRef={registerCellRef}
                />
              </div>
              <div className={`border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}`}>
                <EditableCombobox
                  recordId={i.id}
                  field="work_name"
                  value={i.work_name ?? ""}
                  user={user}
                  options={priceList ?? []}
                  setInvoices={setInvoices}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                  handleKeyNavigation={handleKeyNavigation}
                  registerCellRef={registerCellRef}
                />
              </div>
              <div className={`border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}`}>
                <EditableCell
                  className="justify-center"
                  recordId={i.id}
                  field="pieces"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={i.pieces ?? ""}
                  user={user}
                  setInvoices={setInvoices}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                  handleKeyNavigation={handleKeyNavigation}
                  registerCellRef={registerCellRef}
                />
              </div>
              <div className={`border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}`}>
                <EditableSelect
                  recordId={i.id}
                  field="degree"
                  value={i.degree ?? ""}
                  user={user}
                  options={["50", "80", "100", "120"]}
                  className="justify-end"
                  setInvoices={setInvoices}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                  handleKeyNavigation={handleKeyNavigation}
                  registerCellRef={registerCellRef}
                />
              </div>
              <div className={`flex items-center justify-end border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full py-1.5 px-2 text-right ${index % 2 === 1 ? "bg-slate-800" : "bg-[#2e3b4d]"}`}>{i.amount ?? "0"}</div>
              <div className={`border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}`}>
                <EditableCell
                  className="justify-end"
                  recordId={i.id}
                  field="adjustment"
                  type="tel"
                  inputMode="numeric"
                  pattern="-?[0-9]*"
                  value={i.adjustment ?? 0}
                  user={user}
                  setInvoices={setInvoices}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                  handleKeyNavigation={handleKeyNavigation}
                  registerCellRef={registerCellRef}
                />
              </div>
              <div className={`flex items-center justify-end border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full py-1.5 px-2 text-right ${index % 2 === 1 ? "bg-slate-800" : "bg-[#2e3b4d]"}`}>{i.total_amount ?? "0"}</div>
              <div className={`border border-l-0 border-t-0 border-neutral-600 min-h-8 h-full ${index % 2 === 1 ? "bg-neutral-800" : "bg-[#3a3a3a]"}`}>
                <EditableTextarea
                  recordId={i.id}
                  field="remarks"
                  value={i.remarks ?? ""}
                  user={user}
                  setInvoices={setInvoices}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                  handleKeyNavigation={handleKeyNavigation}
                  registerCellRef={registerCellRef}
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
              setIsTaskLoaded(false);
            }, 10);
          }}
          // transition
          className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/30" />

          <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="relative w-120 space-y-4 rounded-2xl bg-neutral-100 p-6 pt-8">
              {!isTaskLoaded && (
                <div className="flex justify-center my-4" aria-label="読み込み中">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              )}
              {activeTask && user && (
                <InvoiceTaskDetail
                  task={activeTask}
                  onClose={() => { setIsOpen(false); setActiveTask(null); setIsTaskLoaded(false); }}
                />
              )}
            </DialogPanel>
          </div>
        </Dialog>

        {/* 一括入力フォーム */}
        <Dialog
          open={isAllEditableFromOpen}
          onClose={() => {
            setIsAllEditableFromOpen(false);
            setActiveRecord(null);
          }}
          // transition
          className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
        >
          <DialogBackdrop
            onClick={() => { setIsAllEditableFromOpen(false); setActiveRecord(null); }}
            className="fixed inset-0 bg-black/30"
          />

          <div className="fixed inset-0 w-screen flex items-center justify-center">
            <DialogPanel className="relative h-[85svh] w-300 space-y-4 rounded-2xl bg-neutral-100 p-5 pt-6">
              {activeRecord && (
                <AllEditableForm
                  key={activeRecord.currentId}
                  recordId={activeRecord.currentId}
                  prevId={activeRecord.prevId}
                  nextId={activeRecord.nextId}
                  priceList={allPriceList}
                  onClose={() => {
                    setIsAllEditableFromOpen(false);
                    setActiveRecord(null);
                  }}
                  onChangeRecord={(r: string) => {
                    const siblingIsd = getSiblingInvoices(r);
                    setActiveRecord({ currentId: r, prevId: siblingIsd.prev, nextId: siblingIsd.next });
                  }}
                  onCheckTask={() => {
                    if (!activeRecord.currentId) return;
                    handleActiveTask(activeRecord.currentId);
                    setIsOpen(true);
                  }}
                />
              )}
            </DialogPanel>
          </div>
        </Dialog>
      </div>
    </InvoiceEditingProvider>
  )
}