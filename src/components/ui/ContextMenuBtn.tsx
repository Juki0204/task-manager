import { FaRegStickyNote, FaRegTrashAlt, FaRegPauseCircle, FaRegPlayCircle } from "react-icons/fa";
import { supabase } from "@/utils/supabase/supabase";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useState } from "react";
import { CorrectBtn, OutlineBtn } from "./Btn";
import { toast } from "sonner";
import { useAuth } from "@/app/AuthProvider";





//---------InProgress Btn---------

type ProgressProps = {
  taskId: string;
  onClick: () => void;
}

export function ChangeInProgress({ taskId, onClick }: ProgressProps) {
  const handleInProgress = async () => {
    const { data } = await supabase
      .from("tasks")
      .update({ status: "作業中" })
      .eq("id", taskId)
      .single();
  }

  return (
    <li
      onClick={() => {
        handleInProgress();
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
}

export function ChangeInterrupt({ taskId, onClick }: InterruptProps) {
  const handleInterrupt = async () => {
    const { data } = await supabase
      .from("tasks")
      .update({ status: "作業途中" })
      .eq("id", taskId)
      .single();
  }

  return (
    <li
      onClick={() => {
        handleInterrupt();
        onClick();
      }}
      className="flex items-center gap-1 bg-slate-500 py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-sky-700 cursor-pointer"
    >
      <FaRegPauseCircle />作業途中
    </li>
  );
}


//---------NotYetStarted Btn---------

type NotYetStartedProps = {
  taskId: string;
  onClick: () => void;
}

export function ChangeNotYetStarted({ taskId, onClick }: NotYetStartedProps) {
  const handleNotYetStarted = async () => {
    const { data } = await supabase
      .from("tasks")
      .update({ status: "未着手" })
      .eq("id", taskId)
      .single();
  }

  return (
    <li
      onClick={() => {
        handleNotYetStarted();
        onClick();
      }}
      className="flex items-center gap-1 bg-slate-500 py-1 px-2 rounded-md font-bold text-white text-sm hover:bg-sky-700 cursor-pointer"
    >
      <FaRegStickyNote />未着手
    </li>
  );
}


//---------Delete Btn---------

type DeleteProps = {
  taskId: string;
  taskSerial: string;
  onClick: () => void;
}

export function ChangeDelete({ taskId, taskSerial, onClick }: DeleteProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user, loading } = useAuth();

  const handleDelete = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "削除済" })
      .eq("id", taskId)
      .single();

    if (error) {
      alert("タスクの削除に失敗しました");
    } else {
      setIsOpen(false);
      toast.success(`${user?.name}さんが、タスク:${taskSerial}を削除しました。`);
      onClick();
    }
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
              <CorrectBtn className="flex items-center justify-center gap-1 !bg-red-700 !m-0 cursor-pointer hover:opacity-60" onClick={() => handleDelete()}><FaRegTrashAlt />削除</CorrectBtn>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </li>
  );
}