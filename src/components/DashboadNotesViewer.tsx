"use client";

import { useTaskNotesRealtime } from "@/utils/hooks/useTaskNotesRealtime";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AiOutlineFileAdd } from "react-icons/ai";
import { FiEdit3 } from "react-icons/fi";
import { FaRegTrashAlt } from "react-icons/fa";
import { BiSolidRightArrow } from "react-icons/bi";

import { RiFullscreenFill } from "react-icons/ri";
import { MdOutlineNotes } from "react-icons/md";
import { CgBorderStyleSolid } from "react-icons/cg";
import { DiffResult } from "@/utils/function/comparHistory";
import { Task } from "@/utils/types/task";
import { usePathname } from "next/navigation";
import { highlightDiff } from "@/utils/function/highlightDiff";

interface DashboardNotesViewerProps {
  SerialClick: (serial: string) => void;
}

export default function DashboardNotesViewer({ SerialClick }: DashboardNotesViewerProps) {
  const { notes, isReady } = useTaskNotesRealtime();
  const [viewerType, setViewerType] = useState<"all" | "added" | "changed" | "delete">("all");

  const notesRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const scrollToTop = () => {
    const el = notesRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }

  const filteredNotes = useMemo(() => {
    return viewerType === "all"
      ? notes
      : notes.filter((n) => n.type === viewerType);
  }, [viewerType, notes]);

  //表示用項目名コンバーター
  const convertKey = (key: string): string => {
    const convertList = {
      "client": "クライアント",
      "requester": "依頼者",
      "title": "作業タイトル",
      "description": "作業内容",
      "request_date": "依頼日",
      "manager": "担当者",
      "priority": "優先度",
      "remarks": "備考欄",
    };

    return convertList[key as keyof typeof convertList];
  }


  useEffect(() => {
    scrollToTop();
  }, [notes.length]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent | WheelEvent) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      if (!wrapper.contains(e.target as Node)) {
        setTimeout(() => scrollToTop(), 500);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("wheel", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("wheel", handleOutside);
    }
  }, []);

  const handleSerialClick = (serial: string) => {
    SerialClick(serial);
  }

  //ログイン前のページではレンダリングしない
  const falsePathname = ['/login', '/reset', '/signup']
  const pathname = usePathname();

  const isExculedPath = falsePathname.some((path) => pathname.includes(path));

  // if (notes.length === 0) return (
  //   <div className="flex justify-center my-4" aria-label="読み込み中">
  //     <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
  //   </div>
  // );

  return (
    <>
      {!isExculedPath && (
        <div ref={wrapperRef} className="w-full flex flex-col items-end z-30 pointer-events-none">
          {/* ログ一覧表切り替えボタン */}
          <div className="flex gap-4 pr-2 pointer-events-auto">
            <ul className="flex gap-0.5 items-center z-50">
              <li onClick={() => setViewerType("all")} className={`flex items-center justify-center gap-1 backdrop-blur-md h-7 px-2 bg-black/70 rounded-tl-md rounded-tr-md text-white text-sm cursor-pointer hover:opacity-100 ${viewerType === "all" ? "opacity-100 pointer-events-none" : "opacity-40"}`}>ALL</li>
              <li onClick={() => setViewerType("added")} className={`flex items-center justify-center gap-1 backdrop-blur-md h-7 px-2 bg-black/70 rounded-tl-md rounded-tr-md text-white text-base cursor-pointer hover:opacity-100 ${viewerType === "added" ? "opacity-100 pointer-events-none" : "opacity-40"}`}><AiOutlineFileAdd /><span className="text-sm">追加</span></li>
              <li onClick={() => setViewerType("changed")} className={`flex items-center justify-center gap-1 backdrop-blur-md h-7 px-2 bg-black/70 rounded-tl-md rounded-tr-md text-white text-base cursor-pointer hover:opacity-100 ${viewerType === "changed" ? "opacity-100 pointer-events-none" : "opacity-40"}`}><FiEdit3 /><span className="text-sm">編集</span></li>
              <li onClick={() => setViewerType("delete")} className={`flex items-center justify-center gap-1 backdrop-blur-md h-7 px-2 bg-black/70 rounded-tl-md rounded-tr-md text-white text-base cursor-pointer hover:opacity-100 ${viewerType === "delete" ? "opacity-100 pointer-events-none" : "opacity-40"}`}><FaRegTrashAlt /><span className="text-sm">削除済</span></li>
            </ul>
          </div>

          {/* ログ一覧 */}
          <div className="w-full bg-black/70 rounded-lg pl-3 pr-3 py-4 pointer-events-auto">
            <div
              ref={notesRef}
              className={`
              w-full overflow-y-auto text-sm transition-all duration-300
              [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
              h-140 pr-2
            `}>
              <AnimatePresence>
                {filteredNotes.length > 0 ? filteredNotes.map((log) => (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="not-last:border-gray-500/50 not-last:border-b"
                  >
                    <Disclosure>
                      {({ open }) => (
                        <div>
                          <DisclosureButton
                            className="w-full flex justify-between items-center gap-4 px-1 py-2 text-left transition"
                          >
                            <div className="flex justify-between items-center gap-4 w-full truncate">
                              <dl className={`tracking-wider ${open ? "" : "truncate"} w-full ${log.type === "changed" ? "text-gray-100" : log.type === "added" ? "text-cyan-300/80" : log.type === "delete" ? "text-red-400/90" : log.type === "deadline" ? "text-yellow-300/90" : ""}`}>
                                <dt className="text-sm text-gray-400 whitespace-nowrap w-fit">{new Date(log.changed_at).toLocaleString("ja-JP")}</dt>
                                <dd className={`w-full ${open ? "whitespace-normal" : "truncate"}`}>
                                  {log.changed_by}さんが
                                  【<span
                                    className="text-blue-400 underline cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSerialClick(log.task_serial);
                                    }}
                                  >
                                    {log.task_serial}
                                  </span>】 の
                                  {log.message.substring(10)}</dd>
                              </dl>
                            </div>
                            {Object.keys((log.diff as DiffResult).new || {}).length > 0 ? (
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                            ) : (
                              <span className="grid place-content-center w-4 h-4 text-gray-400">ー</span>
                            )}
                          </DisclosureButton>
                          {Object.keys((log.diff as DiffResult).new || {}).length > 0 && (
                            <DisclosurePanel className={`p-3 bg-black/50 rounded-md text-xs text-gray-200 space-y-1 ${open ? "mb-2" : ""}`}>
                              {log.diff &&
                                Object.keys((log.diff as DiffResult).new || {}).map((key) => (
                                  <DiffItem
                                    key={key}
                                    label={convertKey(key)}
                                    oldValue={(log.diff as DiffResult).old[key as keyof Task]}
                                    newValue={(log.diff as DiffResult).new[key as keyof Task]}
                                  />
                                ))
                              }
                            </DisclosurePanel>
                          )}
                        </div>
                      )}
                    </Disclosure>
                  </motion.div>
                )) : (
                  <div className="flex justify-center items-center my-4 h-full" aria-label="読み込み中">
                    <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



//ログ出力用変換コンポーネント
function formatValue(value: string | null | undefined): string {
  if (!value || value === "") return "（なし）";
  if (value === "急") return "至急";
  return value;
}

function DiffItem({
  label,
  oldValue,
  newValue,
}: {
  label: string;
  oldValue: string | null | undefined;
  newValue: string | null | undefined;
}) {
  const isLongField = label === "備考欄" || label === "作業内容";
  const hasDiff = oldValue && newValue && oldValue !== newValue;

  return (
    <div className="flex gap-2 items-center border-l-2 border-blue-400 pl-2">
      <h4 className="font-semibold text-gray-300 whitespace-nowrap">【{label}】</h4>
      <div className={`text-gray-500 leading-relaxed ${!oldValue || oldValue === "" ? "" : "line-through"}`}>{formatValue(oldValue)}</div>
      <BiSolidRightArrow className="font-sm" />

      {isLongField && hasDiff ? (
        <div
          className="text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: highlightDiff(oldValue ?? "", newValue ?? ""),
          }}
        />
      ) : (
        <div className="text-gray-300">{formatValue(newValue)}</div>
      )}
    </div>
  )
}