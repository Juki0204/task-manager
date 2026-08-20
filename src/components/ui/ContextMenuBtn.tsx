import { FaRegStickyNote, FaRegTrashAlt, FaRegPauseCircle, FaRegPlayCircle, FaRegCalendarCheck } from "react-icons/fa";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { ReactNode, useEffect, useState } from "react";
import { CorrectBtn, OutlineBtn } from "./Btn";
import { toast } from "sonner";
import { useAuth } from "@/app/AuthProvider";
import { Task } from "@/utils/types/task";
import { supabase } from "@/utils/supabase/supabase";
import { useInvoiceSync } from "@/utils/hooks/useInvoiceSync";
import { CalendarCheck, CirclePause, CirclePlay, CopyPlus, PackageCheck, Pause, PencilLine, Play, StickyNote, Trash, Trash2, UserMinus } from "lucide-react";
import { User } from "@/utils/types/user";


//---------Btn Template---------
type ContextMenuBtnProps = {
  className?: string;
  onClick: () => void;
  children: ReactNode;
}

//タスクステータス変更時通知メッセージ追加
const taskStatusAddChangeNotes = async (taskId: string, taskSerial: string, userName: string | undefined, status: string) => {
  const { data } = await supabase
    .from('tasks')
    .select('title')
    .eq("id", taskId)
    .single();

  if (!data) return;

  const { error } = await supabase.from("task_notes").insert({
    task_serial: taskSerial,
    message: `【${taskSerial}】${userName ? userName : "unknown"}さんがタスク「${data}」のステータスを【${status}】に変更しました。`,
    diff: {},
    old_record: {},
    new_record: {},
    changed_by: userName ? userName : null,
    changed_at: new Date().toISOString(),
    type: "changed",
  });

  if (error) console.error(error);
}

//タスク担当者を未担当変更時通知メッセージ追加
const taskManagerRemoveChangeNotes = async (taskId: string, taskSerial: string, userName: string | undefined) => {
  const { data } = await supabase
    .from('tasks')
    .select('title')
    .eq("id", taskId)
    .single();

  if (!data) return;

  const { error } = await supabase.from("task_notes").insert({
    task_serial: taskSerial,
    message: `【${taskSerial}】${userName ? userName : "unknown"}さんがタスク「${data}」の担当者を未担当に変更しました。`,
    diff: {},
    old_record: {},
    new_record: {},
    changed_by: userName ? userName : null,
    changed_at: new Date().toISOString(),
    type: "changed",
  });

  if (error) console.error(error);
}


export function ContextMenuBtn({ className, onClick, children }: ContextMenuBtnProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1 py-2 px-1 rounded-md tracking-wider text-sm cursor-pointer hover:bg-neutral-300/60 dark:hover:bg-neutral-700 ${className}`}
    >
      {children}
    </div>
  )
}

//---------Btn Template---------
type FlexContextMenuBtnProps = {
  className?: string;
  onClick: () => void;
  children: ReactNode;
}

export function FlexContextMenuBtn({ className, onClick, children }: FlexContextMenuBtnProps) {
  return (
    <div
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md tracking-wider text-sm cursor-pointer hover:bg-neutral-300/60 dark:hover:bg-neutral-700 ${className}`}
    >
      {children}
    </div>
  )
}


/* ================================================================
 * タスク状態管理関係
  ================================================================ */

//---------InProgress Btn---------

type ProgressProps = {
  taskId: string;
  taskSerial: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeInProgress({ taskId, taskSerial, onClick, updateTaskStatus }: ProgressProps) {
  const { user } = useAuth();

  const handleInProgress = async () => {
    await updateTaskStatus(taskId, "作業中", "", { manager: user?.name, updated_manager: user?.name });
    await taskStatusAddChangeNotes(taskId, taskSerial, user?.name, "作業中");
  }

  return (
    <ContextMenuBtn
      onClick={async () => {
        await handleInProgress();
        onClick();
      }}
    >
      <Play className="w-4" /><span className="font-bold">作業中</span>に変更
    </ContextMenuBtn>
  );
}


//---------Interrupt Btn---------

type InterruptProps = {
  taskId: string;
  taskSerial: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeInterrupt({ taskId, taskSerial, onClick, updateTaskStatus }: InterruptProps) {
  const { user } = useAuth();

  const handleInterrupt = async () => {
    await updateTaskStatus(taskId, "作業途中", "", { updated_manager: user?.name });
    await taskStatusAddChangeNotes(taskId, taskSerial, user?.name, "作業途中");
  }

  return (
    <ContextMenuBtn
      onClick={async () => {
        await handleInterrupt();
        onClick();
      }}
    >
      <Pause className="w-4" /><span className="font-bold">作業を中断</span>する
    </ContextMenuBtn>
  );
}


//---------Confirm Btn---------

type ConfirmProps = {
  taskId: string;
  taskSerial: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeConfirm({ taskId, taskSerial, onClick, updateTaskStatus }: ConfirmProps) {
  const { user } = useAuth();
  const handleConfirm = async () => {
    await updateTaskStatus(taskId, "確認中", "", { updated_manager: user?.name });
    await taskStatusAddChangeNotes(taskId, taskSerial, user?.name, "確認中");
  }

  return (
    <ContextMenuBtn
      onClick={async () => {
        await handleConfirm();
        onClick();
      }}
    >
      <PackageCheck className="w-4" /><span className="font-bold">確認中</span>に変更
    </ContextMenuBtn>
  );
}


//---------NotYetStarted Btn---------

type NotYetStartedProps = {
  taskId: string;
  taskSerial: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeNotYetStarted({ taskId, taskSerial, onClick, updateTaskStatus }: NotYetStartedProps) {
  const { user } = useAuth();

  const handleNotYetStarted = async () => {
    await updateTaskStatus(taskId, "未着手", "", { manager: user?.name, updated_manager: user?.name });
    await taskStatusAddChangeNotes(taskId, taskSerial, user?.name, "未着手");
  }

  return (
    <ContextMenuBtn
      onClick={async () => {
        await handleNotYetStarted();
        onClick();
      }}
    >
      <StickyNote className="w-4" /><span className="font-bold">未着手</span>に戻す
    </ContextMenuBtn>
  );
}


//---------Remove Btn---------

type RemoveProps = {
  taskId: string;
  taskSerial: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeRemove({ taskId, taskSerial, onClick, updateTaskStatus }: RemoveProps) {
  const { user } = useAuth();
  const handleNotYetStarted = async () => {
    await updateTaskStatus(taskId, "未着手", "", { manager: null, updated_manager: user?.name });
    await taskManagerRemoveChangeNotes(taskId, taskSerial, user?.name);
  }

  return (
    <ContextMenuBtn
      onClick={async () => {
        await handleNotYetStarted();
        onClick();
      }}
    >
      <UserMinus className="w-4" /><span className="font-bold">担当から外れる</span>
    </ContextMenuBtn>
  );
}



//---------Complete Btn---------

type CompleteProps = {
  taskId: string;
  taskSerial: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeComplete({ taskId, taskSerial, onClick, updateTaskStatus }: CompleteProps) {
  const { syncInvoiceWithTask } = useInvoiceSync();
  const { user } = useAuth();

  const handleComplete = async () => {
    await updateTaskStatus(taskId, "完了", "", { updated_manager: user?.name });
    await syncInvoiceWithTask(taskId, "完了");
    await taskStatusAddChangeNotes(taskId, taskSerial, user?.name, "未着手");
  }

  return (
    <ContextMenuBtn
      onClick={async () => {
        await handleComplete();
        onClick();
      }}
    >
      <CalendarCheck className="w-4" /><span className="font-bold">完了</span>にする
    </ContextMenuBtn>
  );
}


/* ================================================================
 * タスク変更関係
  ================================================================ */

//---------InsertCopyTask Btn---------

type UpdateTaskBtnProps = {
  taskId: string;
  onClick: () => void;
  onEdit: (t: Task) => void;
}

export function UpdateTaskBtn({ taskId, onClick, onEdit }: UpdateTaskBtnProps) {
  const [editTask, setEditTask] = useState<Task | null>(null);
  const { user } = useAuth();

  const getCurrentTask = async (taskId: string) => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq("id", taskId)
      .single();

    if (!data) return false;
    setEditTask(data);
  };

  const lockedTaskHandler = async () => {
    const { data } = await supabase
      .from('tasks')
      .update({
        locked_by_id: user?.id,
        locked_by_name: user?.name,
        locked_by_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .is("locked_by_id", null)
      .select();

    if (!data?.length) {
      toast.error('他のユーザーが編集中です', { position: "top-center" });
      return false;
    }

    // console.log("locked task: taskId =", task.id);
    return true;
  }

  useEffect(() => {
    getCurrentTask(taskId);
  }, [taskId]);

  return (
    <FlexContextMenuBtn
      onClick={async () => {
        if (!editTask) return;
        lockedTaskHandler();
        onEdit(editTask);
        onClick();
      }}
    >
      <PencilLine className="w-4" /><span className="font-bold">編集</span>
    </FlexContextMenuBtn>
  );
}


//---------InsertCopyTask Btn---------

type CopyTaskBtnProps = {
  taskId: string;
  onClick: () => void;
  onCopyTask: (t: Task) => void;
}

export function CopyTaskBtn({ taskId, onClick, onCopyTask }: CopyTaskBtnProps) {

  const [copiedTask, setCopiedTask] = useState<Task | null>(null);

  const getCurrentTask = async (taskId: string) => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq("id", taskId)
      .single();

    if (!data) return false;
    setCopiedTask(data);
  };

  useEffect(() => {
    getCurrentTask(taskId);
  }, [taskId]);

  return (
    <FlexContextMenuBtn
      onClick={async () => {
        if (!copiedTask) return;
        onCopyTask(copiedTask);
        onClick();
      }}
    >
      <CopyPlus className="w-4" /><span className="font-bold">複製</span>
    </FlexContextMenuBtn>
  );
}


//---------Delete Btn---------

type DeleteTaskBtnProps = {
  taskId: string;
  taskSerial: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function DeleteTaskBtn({ taskId, taskSerial, onClick, updateTaskStatus }: DeleteTaskBtnProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    await updateTaskStatus(taskId, "削除済", "", { updated_manager: user?.name });

    const { data: deleteTask } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    const { error } = await supabase.from("task_notes").insert({
      task_serial: taskSerial,
      message: `【${taskSerial}】タスク「${deleteTask.title}」を削除しました。`,
      diff: {},
      old_record: {},
      new_record: {},
      changed_by: user?.name,
      changed_at: new Date().toISOString(),
      type: "delete",
    });

    if (error) console.error(error);

    setIsOpen(false);
    toast.error(`タスク【${taskSerial}】を削除しました。`);
    onClick();
  }

  return (
    <FlexContextMenuBtn
      onClick={() => {
        setIsOpen(true);
      }}
      className="text-red-700 dark:text-red-500"
    >
      <Trash2 className="w-4" /><span className="font-bold">削除</span>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} transition className="relative z-50 data-closed:opacity-0">
        <DialogBackdrop className="fixed inset-0 bg-black/20 dark:bg-white/10 backdrop-blur-[2px]" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative min-w-sm max-w-xl space-y-4 rounded-2xl bg-neutral-100 dark:text-neutral-200 dark:bg-[#2b2b2b] p-8 pr-6">
            <p className="text-center py-4">タスク:{taskSerial}を削除してもよろしいですか？</p>

            <div className="flex gap-2">
              <OutlineBtn className="cursor-pointer hover:opacity-60" onClick={() => setIsOpen(false)}>キャンセル</OutlineBtn>
              <CorrectBtn className="flex items-center justify-center gap-1 !bg-red-700 !m-0 cursor-pointer hover:opacity-60" onClick={async () => await handleDelete()}><Trash2 className="w-4.5" />削除</CorrectBtn>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </FlexContextMenuBtn>
  );
}
