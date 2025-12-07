"use client";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/utils/types/task";
import { Button, DialogTitle } from "@headlessui/react";
import { MdDriveFileRenameOutline, MdLaptopChromebook, MdMailOutline, MdOutlineStickyNote2 } from "react-icons/md";
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
  const contentRef = useRef<HTMLUListElement>(null);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      const sc = el.scrollHeight > el.clientHeight;
      setHasScrollbar(sc);
      console.log(sc);
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
      <div className="w-full flex flex-wrap justify-between items-center gap-4">
        <p className="w-full text-sm text-left">{task.serial}</p>

        <DialogTitle className="w-[calc(100%-120px)] font-bold col-span-2 text-justify flex gap-1 items-center">
          <MdDriveFileRenameOutline /><span className="flex-1">{task.title}</span>
        </DialogTitle>
      </div>
      <GrClose onClick={onClose} className="absolute top-8 right-6 cursor-pointer" />

      <ul
        ref={contentRef}
        className={`
          ${hasScrollbar ? "pr-2" : ""}
          relative grid grid-cols-2 gap-x-4 gap-y-5 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
        `}
      >
        <li className="flex gap-4 col-span-2">
          <div className="flex flex-col flex-[1.4]">
            <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><MdMailOutline /> 依頼方法</h3>
            <p className="flex gap-1 items-center bg-neutral-200 py-1 px-2 rounded-md">
              {task.method === 'mail'
                ? "メール依頼"
                : task.method === 'tel'
                  ? `電話依頼`
                  : "その他"
              }
            </p>
          </div>
          <div className="flex flex-col flex-2">
            <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><FaRegBuilding /> クライアント</h3>
            <p className="bg-neutral-200 py-1 px-2 rounded-md">{task.client}</p>
          </div>
          <div className="flex flex-col flex-[0.6]">
            <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><IoPersonAddOutline /> 依頼者</h3>
            <p className="bg-neutral-200 py-1 px-2 rounded-md">{task.requester}</p>
          </div>
        </li>

        <li className="flex flex-col col-span-2">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><MdOutlineStickyNote2 /> 作業内容</h3>
          <p className="bg-neutral-200 py-1 px-2 rounded-md">{task.description}</p>
        </li>

        <li className="flex flex-col">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><RiCalendarScheduleLine /> 依頼日</h3>
          <p className="bg-neutral-200 py-1 px-2 rounded-md">{task.request_date}</p>
        </li>

        <li className="flex flex-col">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><FaRegCheckCircle /> 完了日</h3>
          <p className="bg-neutral-200 py-1 px-2 rounded-md">{task.finish_date ? task.finish_date : "-"}</p>
        </li>

        <li className="col-span-2 flex gap-4">
          <div className="flex flex-col w-[calc((100%-1rem)/2)]">
            <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><BsPersonCheck /> 作業担当者</h3>
            <p className="bg-neutral-200 py-1 px-2 rounded-md">{task.manager ? task.manager : "-"}</p>
          </div>
          <div className="flex flex-col w-[calc((100%-3rem)/4)]">
            <h3 className="w-fit whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><MdLaptopChromebook /> 作業状況</h3>
            <p className={`py-1 px-2 rounded-md text-center bg-neutral-200`}>{task.status}</p>
          </div>
          <div className="flex flex-col w-[calc((100%-3rem)/4)]">
            <h3 className="w-fit whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><TbClockExclamation /> 優先度</h3>
            <p className={`py-1 px-2 rounded-md ${task.priority ? "text-center" : "bg-neutral-200"}`}>{task.priority ? task.priority : "-"}</p>
          </div>
        </li>


        <li className="flex flex-col col-span-2 pb-1">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600">
            <LuNotebookPen /> 備考欄
          </h3>
          {task.remarks ? (
            <div className={`whitespace-pre-wrap tiptap-base tiptap-viewer bg-neutral-200 py-1 px-2 rounded-md [text-decoration:none]`} dangerouslySetInnerHTML={{ __html: tiptapMarkdownToHtml(task.remarks) }} />
          ) : (
            <div className="whitespace-pre-wrap min-h-[100px] bg-neutral-200 py-1 px-2 rounded-md">-</div>
          )}
        </li>

      </ul>

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