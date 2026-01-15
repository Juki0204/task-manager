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



export default function TaskNotesViewer() {
  const { reverseNotes, isReady } = useTaskNotesRealtime();

  const notesRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);


  const scrollToBottom = () => {
    const el = notesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  useEffect(() => {
    scrollToBottom();
  }, [reverseNotes.length]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent | WheelEvent) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      if (!wrapper.contains(e.target as Node)) {
        setTimeout(() => scrollToBottom(), 500);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("wheel", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("wheel", handleOutside);
    }
  }, []);

  //ログイン前のページではレンダリングしない
  const falsePathname = ['/login', '/reset', '/signup']
  const pathname = usePathname();

  const isExculedPath = falsePathname.some((path) => pathname.includes(path));

  if (!isReady) return null;

  return (
    <>
      {!isExculedPath && (
        <div ref={wrapperRef} className="w-full flex flex-col items-end pointer-events-none">
          {/* ログ一覧 */}
          <div className="w-full bg-black/50 border border-neutral-700 backdrop-blur-md rounded-lg shadow-lg pl-3 pr-2 py-1 pointer-events-auto">
            <div
              ref={notesRef}
              className={`
              w-full overflow-y-auto text-[13px] tracking-wider transition-all duration-300
              [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
              h-6
            `}>
              <AnimatePresence>
                {reverseNotes.map((log) => (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-full flex justify-between items-center gap-4 px-1 pr-4 py-0.5 text-left transition">
                      <div className="flex justify-between items-center gap-4 w-full truncate">
                        <dl className={`flex justify-start tracking-widest truncate w-full ${log.type === "changed" ? "text-gray-100" : log.type === "added" ? "text-cyan-300/80" : log.type === "delete" ? "text-red-400/90" : log.type === "deadline" ? "text-yellow-300/90" : ""}`}>
                          <dt className="w-fit">{log.changed_by}：</dt>
                          <dd className="w-full truncate">{log.message}</dd>
                        </dl>
                        <p className="text-sm text-gray-400 whitespace-nowrap w-fit">{new Date(log.changed_at).toLocaleString("ja-JP")}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
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