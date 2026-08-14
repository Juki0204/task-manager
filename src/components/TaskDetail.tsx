"use client";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/utils/types/task";
import { Button } from "@headlessui/react";

import { supabase } from "@/utils/supabase/supabase";
import { useTaskPresence } from "@/utils/hooks/useTaskPresence";
import { toast } from "sonner";
import { User } from "@/utils/types/user";
import { tiptapMarkdownToHtml } from "@/utils/function/tiptapMarkdownToHtml";
import { TaskNote } from "@/utils/hooks/useTaskNotesRealtime";

import { extractMailRefs } from "@/utils/function/extractMailRefs";
import MailConverter from "./MailConverter";
import { useTaskUnread } from "./TaskUnreadProvider";
import { AlarmClock, Building, CalendarClock, CircleCheck, Mail, PenLine, RotateCcwClock, Star, UserCheck, UserPlus, X } from "lucide-react";


interface TaskDetailProps {
  task: Task;
  user: User;
  onClose: () => void;
  onEdit: (t: Task) => void;
  deadlineList: { task_id: string, date: string }[];
}


export default function TaskDetail({ task, user, onClose, onEdit, deadlineList }: TaskDetailProps) {
  const editingUser = useTaskPresence(task.id, { id: user.id, name: user.name }, false);

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [importantIds, setImportantIds] = useState<string[]>([]);

  const [notes, setNotes] = useState<TaskNote[] | null>([]);
  const [notesOpen, setNotesOpen] = useState<boolean>(false);

  const currentDeadline = deadlineList?.filter(d => d.task_id === task.id)[0];

  const { isTaskUnread, upsertTaskAcknowledgement } = useTaskUnread();
  const unread = isTaskUnread({ id: task.id, manager: task.manager }, user?.name ?? "");


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
    "未着手": "bg-neutral-100 dark:bg-[#313131] text-neutral-800 dark:text-neutral-100",
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

    // console.log("locked task: taskId =", task.id);
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
      // console.log("important_task_id updated:", updatedIds);

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

  //備考欄のメールチェック
  const [mailOpen, setMailOpen] = useState<boolean>(false);
  const mailRefs = extractMailRefs(task.remarks);
  const [activeMail, setActiveMail] = useState<{ domain: string, prefixNo: number } | null>(null);

  function initActiveMail() {
    if (mailRefs.length === 0) return;
    if (activeMail) return;
    setActiveMail(mailRefs[0]);
  }
  useEffect(() => {
    // console.log(mailRefs);
    initActiveMail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailRefs]);

  // useEffect(() => {
  //   const judgeTimer = setTimeout(() => {
  //     console.log("読みました。");
  //   }, 3000);

  //   return () => {
  //     clearTimeout(judgeTimer);
  //   }
  // }, []);


  //備考欄既読判定
  const remarksAcknowredged = async (task: Task) => {
    const isUnassigned = !task.manager;
    const isMyTask = task.manager === user?.name;

    if (!isUnassigned && !isMyTask) return; //他人のタスクはスキップ

    if (!user) return;

    const ackData = {
      task_id: task.id,
      acknowledged_by: user.name,
      acknowledged_at: new Date(),
    }
    // console.log(ackData);
    const { error } = await supabase
      .from("tasks_acknowledgements")
      .upsert(ackData, {
        onConflict: "task_id,acknowledged_by"
      });

    if (error) console.error("確認フラグの登録に失敗しました。", error);

    upsertTaskAcknowledgement({
      task_id: task.id,
      acknowledged_by: user.name,
      acknowledged_at: new Date(),
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("備考欄を表示しました。");
      remarksAcknowredged(task);
    }, 3000);

    return () => {
      clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="relative w-full flex gap-2 pb-4 pl-1">
        {handleImportantTask && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleImportantTask(task.id);
            }}
            className={`w-4.5 grid place-content-center rounded-md hover:opacity-80 cursor-pointer`}
          >
            <Star className={`text-lg ${importantIds?.includes(task.id) ? "text-amber-500 fill-yellow-300" : "text-neutral-400"}`} />
          </div>
        )}
        <p className="font-bold text-neutral-500 dark:text-neutral-300">{task.serial}</p>
        <p className={`px-4 grid place-content-center rounded-full text-xs font-bold dark:text-neutral-700 ${task.method === "mail" ? "bg-orange-200" : task.method === "tel" ? "bg-green-300/60" : "bg-blue-200"}`}>
          {task.method === 'mail'
            ? "メールで依頼"
            : task.method === 'tel'
              ? `電話で依頼`
              : "その他"
          }
        </p>

        <X onClick={onClose} className="absolute top-0 right-0 cursor-pointer" />
      </div>

      <div className="relative w-full flex flex-wrap justify-between items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-slate-300/50 dark:bg-[#444444] p-3 pb-2 mb-4">

        <h3 className="w-full font-bold text-xl tracking-wider py-1 col-span-2 text-justify flex gap-1 items-center leading-none">
          <PenLine className="w-4.5 text-neutral-500" /><span className="flex-1">{task.title}</span>
        </h3>

        <div className="w-full tracking-wider border-b border-neutral-400 dark:border-neutral-500 py-1.5 px-1 text-sm">{task.description}</div>

        <div className="w-full relative flex gap-2 tracking-wider">
          <div className="flex gap-1 items-center pl-1.5 w-fit whitespace-nowrap py-1.5 font-bold text-sm">
            <UserCheck className="w-4.5 text-neutral-500" />
            <span className="px-1">{task.manager ? task.manager : "-"}</span>
          </div>

          <div className="flex items-center gap-2">
            {task.status && (
              <div className={`flex gap-1 items-center py-0.5 px-6 w-fit h-fit whitespace-nowrap font-bold text-sm rounded-full ${statusStyle}`}>
                {task.status}
              </div>
            )}

            {task.priority && (
              <div className={`flex gap-1 items-center py-0.5 px-4 w-fit h-fit whitespace-nowrap font-bold text-sm rounded-full ${priorityStyle !== "" ? priorityStyle + " text-center rounded-full" : ""}`}>
                {task.priority}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={contentRef}
        className={`
          ${hasScrollbar ? "pr-2" : ""}
          relative grid grid-cols-2 gap-x-4 gap-y-2 max-h-[calc(100svh-330px)] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
        `}
      >

        <div className="col-span-2 flex gap-1 items-center mt-1">
          <span className="text-neutral-500 font-bold text-xs leading-none tracking-widest">DETAILS</span>
          <span className="block h-0.5 bg-neutral-400 dark:bg-neutral-300/30 w-full" />
        </div>

        <div className="col-span-2 pb-4 tracking-wider">
          <div className="w-full flex flex-col gap-2 pt-0 px-2 pb-3">
            <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-600 pb-1.5 px-1.5">
              <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm">
                <Building className="w-4.5 text-neutral-500" /> クライアント
              </h3>
              <p className="py-1 px-2 text-sm font-bold">{task.client}</p>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-600 pb-1.5 px-1.5">
              <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm">
                <UserPlus className="w-4.5 text-neutral-500" /> 依頼担当者
              </h3>
              <p className="py-1 px-2 text-sm font-bold">{task.requester}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 border border-neutral-300 dark:border-neutral-600 rounded-md">
            <div className="flex flex-col p-3 border-r border-neutral-300 dark:border-neutral-600">
              <h3 className="w-28 whitespace-nowrap pb-1 flex gap-1 items-center font-bold text-sm"><CalendarClock className="w-4.5 text-neutral-500" /> 依頼日</h3>
              <p className="border-b border-neutral-400 py-1 px-2 text-sm font-bold">{task.request_date}</p>
            </div>
            <div className="flex flex-col p-3 border-r border-neutral-300 dark:border-neutral-600">
              <h3 className="w-28 whitespace-nowrap pb-1 flex gap-1 items-center font-bold text-sm"><AlarmClock className="w-4.5 text-neutral-500" /> 期限日</h3>
              <p className={`border-b border-neutral-400 py-1 px-2 text-sm font-bold ${currentDeadline ? "text-red-600 dark:text-yellow-400" : ""}`}>{currentDeadline ? currentDeadline.date : "-"}</p>
            </div>
            <div className="flex flex-col p-3">
              <h3 className="w-28 whitespace-nowrap pb-1 flex gap-1 items-center font-bold text-sm"><CircleCheck className="w-4.5 text-neutral-500" /> 完了日</h3>
              <p className="border-b border-neutral-400 py-1 px-2 text-sm font-bold">{task.finish_date ? task.finish_date : "-"}</p>
            </div>
          </div>
        </div>

        {mailRefs.length > 0 && (
          <>
            <div className="col-span-2 flex gap-1 items-center mt-1">
              <span className="text-neutral-500 font-bold text-xs leading-none tracking-widest">ACCESSORIES</span>
              <span className="block h-0.5 bg-neutral-400 dark:bg-neutral-300/30 w-full" />
            </div>

            <div className="col-span-2 flex gap-2 pb-4">
              <div
                onClick={() => { setNotesOpen(false); setMailOpen(!mailOpen) }}
                className="w-fit flex gap-1 items-center px-4 py-0.25 font-normal rounded-full text-xs tracking-wider text-white bg-slate-600 dark:bg-blue-600/50 cursor-pointer transition-all hover:bg-slate-500"
              >
                <Mail className="w-4" />依頼に関連するメール {mailRefs.length}件
              </div>
            </div>
          </>
        )}

        <div className="col-span-2 flex gap-1 items-center mt-1">
          <span className="text-neutral-500 font-bold text-xs leading-none tracking-widest">REMARKS</span>
          <span className="block h-0.5 bg-neutral-400 dark:bg-neutral-300/30 w-full" />
        </div>

        <div className={`relative flex flex-col col-span-2 pb-4`}>
          <div className="border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-[#333333] rounded-md p-2">
            {unread && <span className="px-4 py-0.25 font-bold bg-yellow-200 dark:text-neutral-700 text-xs rounded-full">更新あり</span>}

            {task.remarks ? (
              <div className={`whitespace-pre-wrap tiptap-base tiptap-viewer py-1 px-1 text-sm`} dangerouslySetInnerHTML={{ __html: tiptapMarkdownToHtml(task.remarks) }} />
            ) : (
              <div className="whitespace-pre-wrap min-h-[200px] py-1 px-1 rounded-md text-sm">-</div>
            )}
          </div>
        </div>

        <div className="col-span-2 flex gap-1 items-center mt-1">
          <span className="text-neutral-500 font-bold text-xs leading-none tracking-widest">OTHERS</span>
          <span className="block h-0.5 bg-neutral-400 dark:bg-neutral-300/30 w-full" />
        </div>

        {notes && notes.length > 0 && (
          <div className={`col-span-2 h-auto mb-0 rounded-md pt-0 p-1`}>
            <h3 className="w-fit whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><RotateCcwClock className="w-4.5 text-neutral-500" /> 変更履歴ログ</h3>
            <div className="h-[calc(100%-1.25rem)] pr-2 text-xs overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400">
              {notes?.toReversed().map(note => (
                <p key={note.id} className="not-[:last-of-type]:border-b border-neutral-300 py-1 text-justify">
                  <span className="block">{new Date(note.changed_at).toLocaleString("sv-SE")}</span>
                  {note.changed_by}さんが{note.message.substring(10)}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-neutral-800 pt-4 px-4 pb-3 flex gap-x-2 flex-wrap justify-between col-span-2 mb-0">
        <Button
          disabled={!!editingUser}
          onClick={lockedTaskHandler}
          className="w-full flex gap-2 items-center justify-center mb-3 pr-4 rounded-md bg-neutral-900 dark:bg-slate-700 text-white py-2 px-2 cursor-pointer hover:opacity-80 data-disabled:opacity-30"
        >
          <PenLine className="w-4.5 text-neutral-100" />
          {editingUser ? `${editingUser.userName}さんが編集中...` : "編集"}
        </Button>

        <div className="text-xs">
          <p>作成日時: {task.created_manager} {formatDateJST(task.created_at)}</p>
          <p>最終更新: {task.updated_manager} {formatDateJST(task.updated_at)}</p>
        </div>

        <div className="flex gap-2">
          <Button
            disabled={notes && notes.length > 0 ? false : true}
            onClick={() => { setMailOpen(false); setNotesOpen(!notesOpen); }}
            className="bg-green-900/80 text-white rounded px-4 py-2 text-sm data-hover:bg-green-800 cursor-pointer disabled:grayscale-100 disabled:opacity-50"
          >
            変更履歴
          </Button>
          <Button
            onClick={onClose}
            className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm data-hover:bg-neutral-200 data-hover:text-neutral-700 cursor-pointer"
          >
            閉じる
          </Button>
        </div>
      </div>

      {/* メールドロワー */}
      {mailRefs && mailRefs.length > 0 && (
        <div className={`max-h-160 w-180 right-134  h-full flex flex-col rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-2xl shadow-black/30 p-4 absolute -z-10 bottom-4 pb-3 transition-all duration-300 ${mailOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <X onClick={() => setMailOpen(false)} className="absolute top-4 right-4 cursor-pointer" />
          <div className="grid grid-cols-3 gap-2 mb-4 pr-8">
            {mailRefs.map(m => (
              <div
                key={m.prefixNo}
                onClick={() => {
                  setActiveMail({ domain: m.domain, prefixNo: m.prefixNo });
                }}
                className={`col-span-1 text-center bg-slate-600 text-white rounded-full p-0.5 text-sm cursor-pointer ${activeMail?.prefixNo === m.prefixNo ? "opacity-100" : "opacity-60"}`}
              >
                No.{m.prefixNo}
              </div>
            ))}
          </div>

          {activeMail && mailOpen && <MailConverter domain={activeMail.domain} prefixNo={activeMail.prefixNo} />}
          {activeMail && mailOpen && <p className="text-xs text-red-700 text-center pt-2">※梅田・中洲は特に文字コードが複雑で変換が不安定の為、内容に違和感がある場合は元のメールを確認してください。</p>}
        </div>
      )}

    </>
  )

}
