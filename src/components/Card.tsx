import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { BsPersonCheck } from "react-icons/bs";

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react";
import { GrClose } from "react-icons/gr";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";
import FileModal from "./FileModal";
import UpdateTask from "./UpdateTask";
import { Task } from "@/utils/types/task";
import TaskDetail from "./TaskDetail";

interface CardPropd {
  task: Task;
  onClick: (task: Task) => void;
}

interface taskFileMeta {
  original_name: string,
  stored_name: string,
  file_type: string,
  file_path: string,
  size: string,
  ext: string,
}

export default function Card({ task, onClick, ...props }: CardPropd) {
  const [isFileOpen, setIsFileOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<taskFileMeta | null>(null);

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [currentTaskFile, setCurrentTaskFile] = useState<taskFileMeta[]>([]);

  function definePriorityStyle(priority: string | undefined) {
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

  useEffect(() => {
    definePriorityStyle(task.priority);
    defineStatusStyle(task.status)
  }, [task]);

  return (
    <>
      {/* カード（概要） */}
      <div
        onClick={() => onClick(task)}
        id={task.id}
        className="min-w-90 rounded-xl border-2 border-neutral-600 bg-neutral-800 p-4 text-white tracking-wide cursor-pointer relative
          group-[.rowListStyle]:w-[1568px] group-[.rowListStyle]:py-2 group-[.rowListStyle]:grid group-[.rowListStyle]:[grid-template-areas:'id_ttl_dis_cli-mana_status_date'] group-[.rowListStyle]:items-center group-[.rowListStyle]:grid-cols-[80px_240px_500px_330px_120px_auto]"
        {...props}
      >
        <div className="text-xs">{task.serial}</div>
        <h3 className="font-bold truncate flex items-center gap-1
          group-[.rowListStyle]:[grid-area:ttl]
          group-[.rowListStyle]:text-sm">
          {
            task.method === 'mail' ?
              <MdMailOutline />
              : task.method === 'tel' ?
                <FiPhone />
                :
                <FaRegQuestionCircle />
          }
          {task.title}
        </h3>

        <div className="w-fit flex gap-1 items-center pl-1
          group-[.cardListStyle]:absolute group-[.cardListStyle]:top-4 group-[.cardListStyle]:right-4
          group-[.rowListStyle]:[grid-area:status]">
          {
            task.priority ?
              <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
              :
              <span className="w-7 h-6 opacity-0"></span>
          }
          <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
        </div>

        <div className="line-clamp-2 w-full text-sm
        group-[.cardListStyle]:h-10 group-[.cardListStyle]:mb-3
        group-[.rowListStyle]:[grid-area:dis]">
          {task.description}
        </div>

        <div className="grid gap-2 text-sm grid-cols-6
        group-[.cardListStyle]:mb-2
        group-[.rowListStyle]:[grid-area:cli-mana]">
          <div className="col-span-4 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><FaRegBuilding />{task.client} 《{task.requester}》</div>
          <div className="col-span-2 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><BsPersonCheck />{task.manager ? task.manager : "-"}</div>
        </div>
        <div className="grid gap-2 text-sm grid-cols-6
        group-[.rowListStyle]:[grid-area:date]">
          <div className="col-span-3 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><RiCalendarScheduleLine />{task.requireDate}</div>
          <div className="col-span-3 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><FaRegCheckCircle />{task.finishDate ? task.finishDate : "-"}</div>
        </div>
      </div>

      <Dialog
        open={isFileOpen}
        onClose={() => {
          setIsFileOpen(false);
          setSelectedFile(null);
        }}
        transition
        className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-full items-center justify-center p-4">
          <DialogPanel className="relative w-11/12 max-w-2xl space-y-4 rounded-2xl bg-neutral-100 p-8">
            <DialogTitle className="font-bold text-left col-span-2 flex gap-1 items-center pr-8">
              {selectedFile?.original_name}
            </DialogTitle>

            <GrClose
              onClick={() => {
                setIsFileOpen(false);
                setSelectedFile(null);
              }}
              className="absolute top-8 right-8 cursor-pointer"
            />
            <FileModal file={selectedFile ? selectedFile : currentTaskFile[0]}></FileModal>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}