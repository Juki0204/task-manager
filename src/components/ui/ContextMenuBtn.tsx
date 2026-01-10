import { FaRegStickyNote, FaRegTrashAlt, FaRegPauseCircle, FaRegPlayCircle, FaRegCalendarCheck } from "react-icons/fa";
import { MdPersonRemove, MdOutlineFactCheck } from "react-icons/md";
import { LuCopyPlus } from "react-icons/lu";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useEffect, useState } from "react";
import { CorrectBtn, OutlineBtn } from "./Btn";
import { toast } from "sonner";
import { useAuth } from "@/app/AuthProvider";
import { Task } from "@/utils/types/task";
import { supabase } from "@/utils/supabase/supabase";
import { useInvoiceSync } from "@/utils/hooks/useInvoiceSync";





//---------InProgress Btn---------


type ProgressProps = {
  taskId: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeInProgress({ taskId, onClick, updateTaskStatus }: ProgressProps) {
  const { user } = useAuth();

  const handleInProgress = async () => {
    await updateTaskStatus(taskId, "作業中", "", { manager: user?.name });
  }

  return (
    <li
      onClick={async () => {
        await handleInProgress();
        onClick();
      }}
      className="flex items-center gap-1 bg-slate-500 py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-sky-700 cursor-pointer"
    >
      <FaRegPlayCircle />作業中
    </li>
  );
}

//---------Interrupt Btn---------

type InterruptProps = {
  taskId: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeInterrupt({ taskId, onClick, updateTaskStatus }: InterruptProps) {
  const handleInterrupt = async () => {
    await updateTaskStatus(taskId, "作業途中", "");
  }

  return (
    <li
      onClick={async () => {
        await handleInterrupt();
        onClick();
      }}
      className="flex items-center gap-1 bg-slate-500 py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-sky-700 cursor-pointer"
    >
      <FaRegPauseCircle />作業途中
    </li>
  );
}


//---------Confirm Btn---------

type ConfirmProps = {
  taskId: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeConfirm({ taskId, onClick, updateTaskStatus }: ConfirmProps) {
  const handleConfirm = async () => {
    await updateTaskStatus(taskId, "確認中", "");
  }

  return (
    <li
      onClick={async () => {
        await handleConfirm();
        onClick();
      }}
      className="flex items-center gap-1 bg-slate-500 py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-sky-700 cursor-pointer"
    >
      <MdOutlineFactCheck />確認中
    </li>
  );
}



//---------NotYetStarted Btn---------

type NotYetStartedProps = {
  taskId: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeNotYetStarted({ taskId, onClick, updateTaskStatus }: NotYetStartedProps) {
  const { user } = useAuth();

  const handleNotYetStarted = async () => {
    await updateTaskStatus(taskId, "未着手", "", { manager: user?.name });
  }

  return (
    <li
      onClick={async () => {
        await handleNotYetStarted();
        onClick();
      }}
      className="flex items-center gap-1 bg-slate-500 py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-sky-700 cursor-pointer"
    >
      <FaRegStickyNote />未着手
    </li>
  );
}


//---------Remove Btn---------

type RemoveProps = {
  taskId: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeRemove({ taskId, onClick, updateTaskStatus }: RemoveProps) {
  const handleNotYetStarted = async () => {
    await updateTaskStatus(taskId, "未着手", "", { manager: null });
  }

  return (
    <li
      onClick={async () => {
        await handleNotYetStarted();
        onClick();
      }}
      className="flex items-center gap-1 bg-slate-500 py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-sky-700 cursor-pointer"
    >
      <MdPersonRemove />担当から外す
    </li>
  );
}



//---------Complete Btn---------

type CompleteProps = {
  taskId: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeComplete({ taskId, onClick, updateTaskStatus }: CompleteProps) {
  const { syncInvoiceWithTask } = useInvoiceSync();

  const handleComplete = async () => {
    await updateTaskStatus(taskId, "完了", "");
    await syncInvoiceWithTask(taskId, "完了");
  }

  return (
    <li
      onClick={async () => {
        await handleComplete();
        onClick();
      }}
      className="flex items-center gap-1 bg-slate-500 py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-sky-700 cursor-pointer"
    >
      <FaRegCalendarCheck />完了
    </li>
  );
}



//---------InsertCopyTask Btn---------

type InsertCopyTaskProps = {
  taskId: string;
  onClick: () => void;
  onCopyTask: (t: Task) => void;
}

export function InsertCopyTask({ taskId, onClick, onCopyTask }: InsertCopyTaskProps) {

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
    <li
      onClick={async () => {
        //console.log(copiedTask);
        if (!copiedTask) return;
        onCopyTask(copiedTask);
        onClick();
      }}
      className="flex items-center gap-1 bg-slate-500 py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-sky-700 cursor-pointer"
    >
      <LuCopyPlus />コピーして新規追加
    </li>
  );
}


//---------Delete Btn---------

type DeleteProps = {
  taskId: string;
  taskSerial: string;
  onClick: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
}

export function ChangeDelete({ taskId, taskSerial, onClick, updateTaskStatus }: DeleteProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    await updateTaskStatus(taskId, "削除済", "");

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
    // toast.error(`${user?.name}さんが、タスク:${taskSerial}を削除しました。`);
    onClick();
  }

  return (
    <li
      onClick={() => {
        setIsOpen(true);
      }}
      className="flex items-center gap-1 bg-[#994b4b] py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-red-800 cursor-pointer"
    >
      <FaRegTrashAlt />削除

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} transition className="relative z-50 transition duration-300 ease-out data-closed:opacity-0">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative min-w-sm max-w-xl space-y-4 rounded-2xl bg-neutral-100 p-8 pr-6">
            <p className="text-center py-4">タスク:{taskSerial}を削除してもよろしいですか？</p>

            <div className="flex gap-2">
              <OutlineBtn className="cursor-pointer hover:opacity-60" onClick={() => setIsOpen(false)}>キャンセル</OutlineBtn>
              <CorrectBtn className="flex items-center justify-center gap-1 !bg-red-700 !m-0 cursor-pointer hover:opacity-60" onClick={async () => await handleDelete()}><FaRegTrashAlt />削除</CorrectBtn>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </li>
  );
}