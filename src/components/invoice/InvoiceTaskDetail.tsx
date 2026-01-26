"use client";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/utils/types/task";
import { Button, DialogTitle } from "@headlessui/react";
import { MdAlarm, MdDriveFileRenameOutline, MdLaptopChromebook, MdMailOutline, MdOutlineStickyNote2 } from "react-icons/md";
import { FaRegBuilding, FaRegCheckCircle } from "react-icons/fa";
import { GrClose } from "react-icons/gr";
import { IoPersonAddOutline } from "react-icons/io5";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { BsPersonCheck } from "react-icons/bs";
import { LuNotebookPen } from "react-icons/lu";
import { tiptapMarkdownToHtml } from "@/utils/function/tiptapMarkdownToHtml";
import { TbClockExclamation } from "react-icons/tb";


interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}


export default function InvoiceTaskDetail({ task, onClose }: TaskDetailProps) {

  //スクロールバーの有無を検知（padding調整用）
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      const sc = el.scrollHeight > el.clientHeight;
      setHasScrollbar(sc);
      // console.log(sc);
    };

    check();

    // 中身が変化した時にも反応させる
    const ro = new ResizeObserver(check);
    ro.observe(el);

    el.addEventListener("resize", check);

    return () => {
      ro.disconnect();
      el.removeEventListener("resize", check);
    };
  }, []);

  return (
    <>
      <div className="relative w-full flex flex-wrap justify-between items-center gap-2 rounded-xl bg-slate-300/70 p-3 mb-1">
        <div className="flex items-center gap-2 w-full text-sm text-left leading-none">
          <p>{task.serial}</p>
          <p className={`py-0.5 px-2 rounded-full text-xs ${task.method === "mail" ? "bg-orange-200" : task.method === "tel" ? "bg-green-300/60" : "bg-blue-200"}`}>
            {task.method === 'mail'
              ? "メールで依頼"
              : task.method === 'tel'
                ? `電話で依頼`
                : "その他"
            }
          </p>
        </div>

        <DialogTitle className="w-full font-bold text-lg col-span-2 text-justify flex gap-1 items-center leading-none">
          <MdDriveFileRenameOutline /><span className="flex-1">{task.title}</span>
        </DialogTitle>

        <div className="w-full bg-neutral-100 py-1.5 px-2 text-sm text-neutral-600 rounded-md">{task.description}</div>

        <GrClose onClick={onClose} className="absolute top-3 right-3 cursor-pointer" />
      </div>

      <div
        ref={contentRef}
        className={`
          ${hasScrollbar ? "pr-2" : ""}
          relative grid grid-cols-2 gap-x-4 gap-y-2 mb-3 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
        `}
      >

        <div className="col-span-2 flex gap-1 mt-2 items-center">
          <span className="text-neutral-400/60 text-xs leading-none tracking-widest">META</span>
          <span className="block h-[1px] bg-neutral-300 w-full" />
        </div>

        <div className="relative flex gap-2 col-span-2">
          <div className="flex flex-col flex-1 bg-neutral-200 rounded-md pb-1.5 px-1.5">
            <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><FaRegBuilding /> クライアント</h3>
            <p className="bg-neutral-100 py-1 px-2 rounded-md text-sm">{task.client}</p>
          </div>
          <div className="flex flex-col w-30 bg-neutral-200 rounded-md pb-1.5 px-1.5">
            <h3 className="w-20 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><IoPersonAddOutline /> 依頼者</h3>
            <p className="bg-neutral-100 py-1 px-2 rounded-md text-sm">{task.requester}</p>
          </div>

          <div className="flex flex-col w-30 bg-amber-800/15 rounded-md pb-1.5 px-1.5">
            <h3 className="w-20 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><RiCalendarScheduleLine /> 依頼日</h3>
            <p className="bg-neutral-100 py-1 px-2 rounded-md text-sm">{task.request_date}</p>
          </div>
        </div>

        <div className="col-span-2 flex gap-1 items-center mt-1">
          <span className="text-neutral-400/60 text-xs leading-none tracking-widest">STATUS</span>
          <span className="block h-[1px] bg-neutral-300 w-full" />
        </div>


        <div className="col-span-2 flex gap-2">
          <div className="flex flex-1 flex-wrap gap-2">
            <div className="flex flex-col flex-1 bg-neutral-200 rounded-md pb-1.5 px-1.5">
              <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><BsPersonCheck /> 作業担当者</h3>
              <p className="bg-neutral-100 py-1 px-2 rounded-md text-sm">{task.manager ? task.manager : "-"}</p>
            </div>
            <div className="flex flex-col w-30 bg-neutral-200 rounded-md pb-1.5 px-1.5">
              <h3 className="w-fit whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><TbClockExclamation /> 優先度</h3>
              <p className={`py-1 px-2 rounded-md text-sm font-bold text-center bg-neutral-100`}>{task.priority ? task.priority : "-"}</p>
            </div>
            <div className="flex flex-col w-full bg-neutral-200 rounded-md pb-1.5 px-1.5">
              <h3 className="w-fit whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><MdLaptopChromebook /> 作業状況</h3>
              <p className={`py-1 px-2 rounded-md text-center text-sm bg-neutral-100`}>{task.status}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col w-30 bg-amber-800/15 rounded-md pb-1.5 px-1.5">
              <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><MdAlarm /> 期限日</h3>
              <p className={`bg-neutral-100 py-1 px-2 rounded-md text-sm `}>-</p>
            </div>
            <div className="flex flex-col w-30 bg-amber-800/15 rounded-md pb-1.5 px-1.5">
              <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><FaRegCheckCircle /> 完了日</h3>
              <p className="bg-neutral-100 py-1 px-2 rounded-md text-sm">{task.finish_date ? task.finish_date : "-"}</p>
            </div>
          </div>
        </div>

        <div className="col-span-2 flex gap-1 items-center mt-1">
          <span className="text-neutral-400/60 text-xs leading-none tracking-widest">REMARKS</span>
          <span className="block h-[1px] bg-neutral-300 w-full" />
        </div>

        <div className="flex flex-col col-span-2 bg-neutral-200 rounded-md pb-1.5 px-1.5">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600">
            <LuNotebookPen /> 備考欄
            {/* {user && unreadIds?.includes(task.id) && (<div className="left-1.5 w-2 h-2 bg-yellow-300 rounded-full" />)} */}
          </h3>
          {task.remarks ? (
            <div className={`whitespace-pre-wrap tiptap-base tiptap-viewer bg-neutral-100 py-1 px-2 rounded-md text-sm`} dangerouslySetInnerHTML={{ __html: tiptapMarkdownToHtml(task.remarks) }} />
          ) : (
            <div className="whitespace-pre-wrap min-h-[100px] bg-neutral-200 py-1 px-2 rounded-md text-sm">-</div>
          )}
        </div>

      </div>

      <div className="flex gap-x-4 flex-wrap justify-end col-span-2 mb-0">
        <div className="flex gap-2">
          <Button
            onClick={onClose}
            className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm data-hover:bg-neutral-200 cursor-pointer"
          >
            閉じる
          </Button>
        </div>
      </div>
    </>
  )
}