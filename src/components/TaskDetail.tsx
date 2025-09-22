"use client";

import { useEffect, useState } from "react";
import { Task } from "@/utils/types/task";
import { Button, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { MdDriveFileRenameOutline, MdLaptopChromebook, MdMailOutline, MdOutlineStickyNote2 } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { FaRegBuilding, FaRegCheckCircle, FaRegImage, FaRegQuestionCircle } from "react-icons/fa";
import { GrClose } from "react-icons/gr";
import { IoDocumentAttachOutline, IoPersonAddOutline } from "react-icons/io5";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { BsPersonCheck } from "react-icons/bs";
import { LuNotebookPen } from "react-icons/lu";
import { supabase } from "@/utils/supabase/supabase";
import FileModal from "./FileModal";



interface taskFileMeta {
  original_name: string,
  stored_name: string,
  file_type: string,
  file_path: string,
  size: string,
  ext: string,
}

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
}


export default function TaskDetail({ task, onClose, onEdit }: TaskDetailProps) {
  const [isFileOpen, setIsFileOpen] = useState<boolean>(false);

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [currentTaskFile, setCurrentTaskFile] = useState<taskFileMeta[]>([]);
  const [selectedFile, setSelectedFile] = useState<taskFileMeta | null>(null);

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

  function formatDateJST(dateString: string): string {
    const date = new Date(dateString);

    // UTCをベースにしているので、getUTC系で取り出して+9時間する
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${jst.getFullYear()}/${pad(jst.getMonth() + 1)}/${pad(jst.getDate())} ` + `${pad(jst.getHours())}:${pad(jst.getMinutes())}:${pad(jst.getSeconds())}`;
  }

  const getTaskFiles = async () => {
    const { data: fileMetadata } = await supabase
      .from('task_files')
      .select('*')
      .eq("task_id", task.id);

    if (fileMetadata && fileMetadata[0]) {
      const taskFileArray = [];
      console.log(fileMetadata);
      for (const file of fileMetadata[0].files) {
        taskFileArray.push(file);
      }

      setCurrentTaskFile(taskFileArray);
      console.log(taskFileArray);
    }
  }

  useEffect(() => {
    definePriorityStyle(task.priority);
    defineStatusStyle(task.status)
    getTaskFiles();
  }, [task]);

  return (
    <>
      <p className="w-full text-sm text-center">{task.serial}</p>
      <DialogTitle className="font-bold text-left col-span-2 flex gap-1 items-center pr-8">
        <span className="w-4">
          {task.method === 'mail' ? <MdMailOutline /> : task.method === 'tel' ? <FiPhone /> : <FaRegQuestionCircle />}
        </span>
        {task.title}
      </DialogTitle>
      <div className="w-full flex justify-between items-center gap-4">
        <div className="w-fit flex gap-1 items-center">
          {
            task.priority ?
              <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
              :
              <></>
          }
          <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
        </div>
        <div onClick={onEdit} className="flex gap-2 items-center text-xs w-fit rounded-md bg-neutral-900 text-white py-1 px-2 cursor-pointer hover:opacity-80"><MdDriveFileRenameOutline /> 編集</div>
      </div>
      <GrClose onClick={onClose} className="absolute top-8 right-8 cursor-pointer" />

      <ul className="relative grid grid-cols-2 gap-x-4 gap-y-5">
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
          <p>{task.requestDate}</p>
        </li>

        <li className="flex flex-col border-b border-neutral-300">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><FaRegCheckCircle /> 完了日</h3>
          <p>{task.finishDate ? task.finishDate : "-"}</p>
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
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><LuNotebookPen /> 備考欄</h3>
          <p className="whitespace-pre-wrap">{task.remarks ? task.remarks : "-"}</p>
        </li>

        <li className="flex flex-col col-span-2 border-b border-neutral-300 pb-1">
          <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><IoDocumentAttachOutline /> 関連ファイル</h3>
          <div className="flex flex-col gap-1">
            {currentTaskFile?.map(file => (
              <div
                key={file.stored_name}
                onClick={() => {
                  setSelectedFile(file);
                  setIsFileOpen(true);
                }}
                className="flex gap-1 items-center text-sm p-1 w-full rounded-md bg-neutral-300 cursor-pointer"
              >
                {
                  file.ext === 'eml' ?
                    <>
                      <MdMailOutline className="w-5 h-5" /> <span className="flex-1 truncate">{file.original_name}</span>
                    </>
                    : // 'jpg' || 'jpeg' || 'png' || 'gif'
                    <>
                      <FaRegImage className="w-5 h-5" /> {file.original_name}
                    </>
                }
              </div>
            ))}
          </div>
        </li>
      </ul>

      <div className="flex gap-x-4 flex-wrap justify-between col-span-2">
        <div className="text-xs">
          <p>作成日時: {task.createdManager} {formatDateJST(task.createdAt)}</p>
          <p>最終更新: {task.updatedManager} {formatDateJST(task.updatedAt)}</p>
        </div>
        <Button
          onClick={onClose}
          className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm data-hover:bg-neutral-200 cursor-pointer"
        >
          閉じる
        </Button>
      </div>


      {/* ファイル閲覧用モーダル */}
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