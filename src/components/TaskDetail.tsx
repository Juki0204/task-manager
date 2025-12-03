"use client";

import { useEffect, useState } from "react";
import { Task } from "@/utils/types/task";
import { Button, DialogTitle } from "@headlessui/react";
import { MdDriveFileRenameOutline, MdLaptopChromebook, MdMailOutline, MdOutlineStickyNote2 } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { GrClose } from "react-icons/gr";
import { IoPersonAddOutline } from "react-icons/io5";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { BsPersonCheck } from "react-icons/bs";
import { LuNotebookPen } from "react-icons/lu";
import { supabase } from "@/utils/supabase/supabase";
import { useTaskPresence } from "@/utils/hooks/useTaskPresence";
import { toast } from "sonner";
import { User } from "@/utils/types/user";
import { tiptapMarkdownToHtml } from "@/utils/function/tiptapMarkdownToHtml";
import { TaskNote } from "@/utils/hooks/useTaskNotesRealtime";


interface TaskDetailProps {
  task: Task;
  user: User;
  unreadIds?: string[];
  onClose: () => void;
  onEdit: () => void;
}


export default function TaskDetail({ task, user, unreadIds, onClose, onEdit }: TaskDetailProps) {
  const editingUser = useTaskPresence(task.id, { id: user.id, name: user.name }, false);

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [notes, setNotes] = useState<TaskNote[] | null>([]);
  const [notesOpen, setNotesOpen] = useState<boolean>(false);

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

  function formatDateJST(dateString: string): string {
    const date = new Date(dateString);

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ` + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }


  const lockedTaskHandler = async () => {
    const { data } = await supabase
      .from('tasks')
      .update({
        locked_by_id: user.id,
        locked_by_name: user.name,
        locked_by_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .is("locked_by_id", null)
      .select();

    if (!data?.length) {
      toast.error('他のユーザーが編集中です');
      return;
    }

    console.log("locked task: taskId =", task.id);
    onEdit();
  }

  //変更履歴ログの取得
  const getFixedNotes = async () => {
    const { data: notes, error: notesError } = await supabase
      .from("task_notes")
      .select("*")
      .eq("task_serial", task.serial);

    if (!notes) return;

    setNotes(notes);
  }

  useEffect(() => {
    definePriorityStyle(task.priority);
    defineStatusStyle(task.status)
    getFixedNotes();
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
            {user && unreadIds?.includes(task.id) && (<div className="left-1.5 w-2 h-2 bg-yellow-300 rounded-full" />)}
          </h3>
          {task.remarks ? (
            <div className={`whitespace-pre-wrap tiptap-base tiptap-viewer`} dangerouslySetInnerHTML={{ __html: tiptapMarkdownToHtml(task.remarks) }} />
          ) : (
            <div className="whitespace-pre-wrap min-h-[100px]">-</div>
          )}
        </li>

      </ul>

      <div className="flex gap-x-4 flex-wrap justify-between col-span-2 mb-0">
        <Button
          disabled={!!editingUser}
          onClick={lockedTaskHandler}
          className="w-full flex gap-2 items-center justify-center mb-3 pr-4 rounded-md bg-neutral-900 text-white py-2 px-2 cursor-pointer hover:opacity-80 data-disabled:opacity-30"
        >
          <MdDriveFileRenameOutline />
          {editingUser ? `${editingUser.userName}さんが編集中...` : "編集"}
        </Button>

        <div className="text-xs">
          <p>作成日時: {task.created_manager} {formatDateJST(task.created_at)}</p>
          <p>最終更新: {task.updated_manager} {formatDateJST(task.updated_at)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={notes && notes.length > 0 ? false : true}
            onClick={() => setNotesOpen(!notesOpen)}
            className="bg-green-900 text-white rounded px-4 py-2 text-sm data-hover:bg-green-800 cursor-pointer disabled:grayscale-100 disabled:opacity-50"
          >
            変更履歴
          </Button>
          <Button
            onClick={onClose}
            className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm data-hover:bg-neutral-200 cursor-pointer"
          >
            閉じる
          </Button>
        </div>
      </div>

      {notes && notes.length > 0 && (
        <div className={`w-80 h-120 bg-white p-4 pr-3 rounded-2xl absolute bottom-0 -z-10 transition-all duration-200 ${notesOpen ? "left-[calc(100%+1rem)]" : "left-0"}`}>
          <h3 className="font-bold text-sm">変更履歴ログ</h3>
          <div className="h-[calc(100%-1.25rem)] pr-2 text-xs overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400">
            {notes?.map(note => (
              <p key={note.id} className="not-[:last-of-type]:border-b border-neutral-300 py-1 text-justify">
                <span className="block">{new Date(note.changed_at).toLocaleString("sv-SE")}</span>
                {note.changed_by}さんが{note.message.substring(10)}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  )
}