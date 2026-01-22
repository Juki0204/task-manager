"use client";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/utils/types/task";
import { Button, DialogTitle } from "@headlessui/react";

import { MdAlarm, MdDriveFileRenameOutline, MdLaptopChromebook, MdMailOutline, MdOutlineStickyNote2 } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { GrClose } from "react-icons/gr";
import { IoPersonAddOutline } from "react-icons/io5";
import { RiCalendarScheduleLine, RiFlag2Fill } from "react-icons/ri";
import { BsPersonCheck } from "react-icons/bs";
import { LuNotebookPen } from "react-icons/lu";

import { supabase } from "@/utils/supabase/supabase";
import { useTaskPresence } from "@/utils/hooks/useTaskPresence";
import { toast } from "sonner";
import { User } from "@/utils/types/user";
import { tiptapMarkdownToHtml } from "@/utils/function/tiptapMarkdownToHtml";
import { TaskNote } from "@/utils/hooks/useTaskNotesRealtime";
import { TbClockExclamation } from "react-icons/tb";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";


interface TaskDetailProps {
  task: Task;
  user: User;
  unreadIds?: string[];
  onClose: () => void;
  onEdit: (t: Task) => void;
  deadlineList: { task_id: string, date: string }[];
}


export default function TaskDetail({ task, user, unreadIds, onClose, onEdit, deadlineList }: TaskDetailProps) {
  const editingUser = useTaskPresence(task.id, { id: user.id, name: user.name }, false);

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [importantIds, setImportantIds] = useState<string[]>([]);

  const [notes, setNotes] = useState<TaskNote[] | null>([]);
  const [notesOpen, setNotesOpen] = useState<boolean>(false);

  const currentDeadline = deadlineList?.filter(d => d.task_id === task.id)[0];

  const priorityStyles: Record<string, string> = {
    "急": "bg-red-300 text-red-800",
    "高": "bg-orange-300 text-orange-800",
    "低": "bg-emerald-300 text-emerald-800",
  } as const;

  function definePriorityStyle(priority: string | null) {
    if (priority) {
      const style = priorityStyles[priority] ?? ""
      setPriorityStyle(style);
    }
  }

  const statusStyles: Record<string, string> = {
    "未着手": "bg-neutral-100 text-neutral-800",
    "作業中": "bg-blue-300 text-blue-800",
    "作業途中": "bg-blue-200 text-blue-800",
    "確認中": "bg-pink-300 text-pink-800",
    "完了": "bg-green-300 text-green-800",
    "保留": "bg-yellow-300 text-yellow-800",
    "中止": "bg-neutral-600 text-neutral-200",
    "詳細待ち": "bg-neutral-500 text-neutral-200",
  }

  function defineStatusStyle(status: string) {
    const style = statusStyles[status];
    setStatusStyle(style);
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
      toast.error('他のユーザーが編集中です', { position: "top-center" });
      return;
    }

    console.log("locked task: taskId =", task.id);
    onEdit(task);
  }

  //変更履歴ログの取得
  const getFixedNotes = async () => {
    const { data: notes } = await supabase
      .from("task_notes")
      .select("*")
      .eq("task_serial", task.serial);

    if (!notes) return;

    setNotes(notes);
  }

  async function handleImportantTask(taskId: string) {
    if (!user) return;
    if (!taskId) return;

    setImportantIds((prev) => prev.filter((id) => id !== taskId));

    const { data: importantTasks, error } = await supabase
      .from("users")
      .select("important_task_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Failed to fetch important_task_id:", error);
      return;
    }

    const currentIds = Array.isArray(importantTasks.important_task_id)
      ? importantTasks.important_task_id
      : [];

    const updatedIds = currentIds.includes(taskId)
      ? currentIds.filter((id) => id !== taskId)
      : [...currentIds, taskId];

    const { error: updateError } = await supabase
      .from("users")
      .update({ important_task_id: updatedIds })
      .eq("id", user.id);

    if (updateError) {
      console.error(`Failed to update important_task_id for user ${user.id}:`, updateError);
    } else {
      console.log("important_task_id updated:", updatedIds);

      if (currentIds.includes(taskId)) {
        // 削除モード
        setImportantIds((prev) => prev.filter((id) => id !== taskId));
      } else {
        // 追加モード
        setImportantIds((prev) => [...prev, taskId]);
      }
    }
  }

  useEffect(() => {
    definePriorityStyle(task.priority);
    defineStatusStyle(task.status)
    getFixedNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  useEffect(() => {
    if (user?.important_task_id) {
      setImportantIds(user.important_task_id);
    }
  }, [user])


  //スクロールバーの有無を検知（padding調整用）
  const contentRef = useRef<HTMLDivElement>(null);
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
              <p className={`py-1 px-2 rounded-md text-sm font-bold ${priorityStyle !== "" ? priorityStyle + " text-center" : "bg-neutral-100"}`}>{task.priority ? task.priority : "-"}</p>
            </div>
            <div className="flex flex-col w-full bg-neutral-200 rounded-md pb-1.5 px-1.5">
              <h3 className="w-fit whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><MdLaptopChromebook /> 作業状況</h3>
              <p className={`py-1 px-2 rounded-md text-center text-sm font-bold ${statusStyle}`}>{task.status}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col w-30 bg-amber-800/15 rounded-md pb-1.5 px-1.5">
              <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600"><MdAlarm /> 期限日</h3>
              <p className={`bg-neutral-100 py-1 px-2 rounded-md text-sm ${currentDeadline ? "text-red-600" : ""}`}>{currentDeadline ? currentDeadline.date : "-"}</p>
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
          {handleImportantTask && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleImportantTask(task.id);
              }}
              className={`w-9 h-9 grid place-content-center bg-neutral-300 rounded-md hover:opacity-80 ${importantIds?.includes(task.id) ? "bg-red-700/20" : "bg-neutral-300"}`}
            >
              <RiFlag2Fill className={`text-lg ${importantIds?.includes(task.id) ? "text-red-500/80" : "opacity-20 grayscale-100"}`} />
            </div>
          )}
          <Button
            disabled={notes && notes.length > 0 ? false : true}
            onClick={() => setNotesOpen(!notesOpen)}
            className="bg-green-900/80 text-white rounded px-4 py-2 text-sm data-hover:bg-green-800 cursor-pointer disabled:grayscale-100 disabled:opacity-50"
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
          <h3 className="font-bold text-sm text-center">変更履歴ログ</h3>
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