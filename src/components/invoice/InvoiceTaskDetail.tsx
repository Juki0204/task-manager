"use client";

import { useEffect, useState } from "react";
import { Task } from "@/utils/types/task";
import { Button, DialogTitle } from "@headlessui/react";
import { MdLaptopChromebook, MdMailOutline, MdOutlineStickyNote2 } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { GrClose } from "react-icons/gr";
import { IoPersonAddOutline } from "react-icons/io5";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { BsPersonCheck } from "react-icons/bs";
import { LuNotebookPen } from "react-icons/lu";
import { User } from "@/utils/types/user";


interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}


export default function InvoiceTaskDetail({ task, onClose }: TaskDetailProps) {

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  function definePriorityStyle(priority: string | null) {
    if (priority === '急') {
      setPriorityStyle('bg-red-300 text-red-800');
    } else if (priority === '高') {
      setPriorityStyle('bg-orange-300 text-orange-800');
    } else if (priority === '低') {
      setPriorityStyle('bg-emerald-300 text-emerald-800');
    }
  }

  function defineStatusStyle(status: string) {
    if (status === '未着手') {
      setStatusStyle('bg-neutral-300 text-neutral-800');
    } else if (status === '作業中') {
      setStatusStyle('bg-blue-300 text-blue-800');
    } else if (status === '作業途中') {
      setStatusStyle('bg-blue-200 text-blue-800');
    } else if (status === '確認中') {
      setStatusStyle('bg-pink-300 text-pink-800');
    } else if (status === '完了') {
      setStatusStyle('bg-green-300 text-green-800');
    } else if (status === '保留') {
      setStatusStyle('bg-yellow-300 text-yellow-800');
    } else if (status === '中止') {
      setStatusStyle('bg-neutral-600 text-neutral-200');
    } else if (status === '詳細待ち') {
      setStatusStyle('bg-neutral-500 text-neutral-200');
    }
  }


  //備考欄の文字列からURLを判別してリンク化
  const convertUrlsToLinks = (text: string): string => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target"_blank" rel="noopener noreferrer" class="text-blue-600 underline">${url}</a>`;
    });
  }

  useEffect(() => {
    definePriorityStyle(task.priority);
    defineStatusStyle(task.status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  return (
    <>
      <p className="w-full text-sm text-center">{task.serial}</p>
      <div className="w-full flex justify-between items-center gap-4">
        <DialogTitle className="flex-1 font-bold col-span-2 text-justify flex gap-1 items-center">
          <span className="w-4">
            {task.method === 'mail' ? <MdMailOutline /> : task.method === 'tel' ? <FiPhone /> : <FaRegQuestionCircle />}
          </span>
          {task.title}
        </DialogTitle>
        <div className="w-fit flex gap-1 items-center">
          {
            task.priority ?
              <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
              :
              <></>
          }
          <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
        </div>
      </div>
      <GrClose onClick={onClose} className="absolute top-8 right-8 cursor-pointer" />

      <ul className="relative grid grid-cols-2 gap-x-4 gap-y-5 max-h-[60vh] pr-2 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
        <li className="flex flex-col border-b border-neutral-300">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><FaRegBuilding /> クライアント</h3>
          <p>{task.client}</p>
        </li>

        <li className="flex flex-col border-b border-neutral-300">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><IoPersonAddOutline /> 依頼者</h3>
          <p>{task.requester}</p>
        </li>

        <li className="flex flex-col col-span-2 border-b border-neutral-300">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><MdOutlineStickyNote2 /> 作業内容</h3>
          <p>{task.description}</p>
        </li>

        <li className="flex flex-col border-b border-neutral-300">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><RiCalendarScheduleLine /> 依頼日</h3>
          <p>{task.request_date}</p>
        </li>

        <li className="flex flex-col border-b border-neutral-300">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><FaRegCheckCircle /> 完了日</h3>
          <p>{task.finish_date ? task.finish_date : "-"}</p>
        </li>

        <li className="flex flex-col border-b border-neutral-300">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><BsPersonCheck /> 作業担当者</h3>
          <p>{task.manager ? task.manager : "-"}</p>
        </li>

        <li className="flex flex-col border-b border-neutral-300">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><MdLaptopChromebook /> 作業状況</h3>
          <p>{task.status}</p>
        </li>

        <li className="flex flex-col col-span-2 border-b border-neutral-300">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm">
            <LuNotebookPen /> 備考欄
          </h3>
          {task.remarks ? (
            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: convertUrlsToLinks(task.remarks) }} />
          ) : (
            <div className="whitespace-pre-wrap">-</div>
          )}
        </li>

      </ul>

      <div className="flex gap-x-4 flex-wrap justify-end col-span-2">

        <Button
          onClick={onClose}
          className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm data-hover:bg-neutral-200 cursor-pointer"
        >
          閉じる
        </Button>
      </div>
    </>
  )
}