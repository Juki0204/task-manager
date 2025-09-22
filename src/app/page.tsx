"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";
import AddTask from "@/components/AddTask";

import TaskList from "@/components/TaskList";
import { Task } from "@/utils/types/task";
import { Button, Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import { GrAddCircle } from "react-icons/gr";

type taskListStyle = "rowListStyle" | "cardListStyle";

export default function Home() {

  const [taskListStyle, setTaskListStyle] = useState<taskListStyle>('cardListStyle');
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('taskListStyle');
    if (saved === 'rowListStyle' || saved === 'cardListStyle') {
      setTaskListStyle(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('taskListStyle', taskListStyle);
  }, [taskListStyle]);


  return (
    <div className={`${taskListStyle} group p-1 py-4 sm:p-4 !pt-21 max-w-[1600px] relative`}>
      <div className="flex justify-between items-center relative">
        <select value={taskListStyle} onChange={(e) => setTaskListStyle(e.target.value as taskListStyle)} className="w-fit py-1.5 px-3 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25">
          <option value='cardListStyle'>カード型リスト</option>
          <option value='rowListStyle'>列型リスト</option>
        </select>
        <Button onClick={() => { setIsOpen(true); setModalType("add"); }} className="flex items-center gap-2 ml-auto mr-0 rounded bg-sky-600 px-4 py-2 text-sm text-white font-bold data-active:bg-sky-700 data-hover:bg-sky-500 cursor-pointer"><GrAddCircle />新規追加</Button>
        {/* <TaskModal isOpen={isOpen} onModalReset={() => { setIsOpen(false); setModalType(null) }}></TaskModal> */}
      </div>
      <TaskList onClick={(t: Task) => { setIsOpen(true); setActiveTask(t); setModalType("detail"); }}></TaskList>

      {/* 共通モーダル */}
      <Dialog open={isOpen} onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }} transition className="relative z-50 transition duration-300 ease-out data-closed:opacity-0">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative min-w-sm max-w-xl space-y-4 rounded-2xl bg-neutral-100 p-8 pr-6">
            {modalType === "add" && <AddTask onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }} />}
            {modalType === "detail" && activeTask && (
              <TaskDetail
                task={activeTask}
                onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }}
                onEdit={() => setModalType("edit")}
              />
            )}

            {modalType === "edit" && activeTask && (
              <UpdateTask task={activeTask} onComplete={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }} onCancel={() => setModalType("detail")}></UpdateTask>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
