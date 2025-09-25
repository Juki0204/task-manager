"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";
import AddTask from "@/components/AddTask";

import PersonalTaskList from "@/components/PersonalTaskList";
import { Button, Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Task } from "@/utils/types/task";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import { GrAddCircle } from "react-icons/gr";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "../AuthProvider";
import { dbTaskProps, mapDbTaskToTask } from "@/utils/function/mapDbTaskToTask";
import { toast } from "sonner";


export default function Home() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [taskList, setTaskList] = useState<Task[]>([]);
  const { user, loading } = useAuth();

  const getTasks = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .or(`manager.eq.${user?.name},manager.eq.`) //自分or空

    if (tasks) {
      // console.log(tasks);
      const taskData: Task[] = [];
      tasks.forEach(task => {
        const currentTaskData = mapDbTaskToTask(task);
        taskData.push(currentTaskData);
      });
      setTaskList(taskData);
      // console.log(taskData);
    }
  }

  useEffect(() => {
    getTasks();
    const channel = supabase
      .channel('task-changes')
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          // console.log('realtime:', payload);

          if (payload.eventType === "INSERT") {
            toast.success('新しいタスクが追加されました。');
            setTaskList((prev) => [...prev, mapDbTaskToTask(payload.new as dbTaskProps)]);
          }
          if (payload.eventType === "UPDATE") {
            // toast.info('タスクが更新されました。');
            setTaskList((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? mapDbTaskToTask(payload.new as dbTaskProps) : t
              )
            );
          }
          if (payload.eventType === "DELETE") {
            toast.error('タスクが削除されました。');
            setTaskList((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [user]);

  useEffect(() => {
    if (activeTask) {
      const updated = taskList.find((t) => t.id === activeTask.id);
      if (updated) setActiveTask(updated);
    }
  }, [taskList]);

  return (
    <div className="cardListStyle group p-1 py-4 sm:p-4 !pt-21 max-w-[1600px] relative overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <div className="flex justify-between items-center">
        <Button onClick={() => { setIsOpen(true); setModalType("add"); }} className="flex items-center gap-2 ml-auto mr-0 rounded bg-sky-600 px-4 py-2 text-sm text-white font-bold data-active:bg-sky-700 data-hover:bg-sky-500 cursor-pointer"><GrAddCircle />新規追加</Button>
      </div>
      {user && <PersonalTaskList user={user} taskList={taskList} onClick={(t: Task) => { setIsOpen(true); setActiveTask(t); setModalType("detail"); }}></PersonalTaskList>}

      {/* 共通モーダル */}
      <Dialog open={isOpen} onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }} transition className="relative z-50 transition duration-300 ease-out data-closed:opacity-0">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative min-w-sm max-w-xl space-y-4 rounded-2xl bg-neutral-100 p-8 pr-6">
            {modalType === "add" && <AddTask onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }} />}
            {modalType === "detail" && activeTask && user && (
              <TaskDetail
                user={user}
                task={activeTask}
                onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }}
                onEdit={() => setModalType("edit")}
              />
            )}

            {modalType === "edit" && activeTask && user && (
              <UpdateTask user={user} task={activeTask} onComplete={() => setModalType("detail")} onCancel={() => setModalType("detail")}></UpdateTask>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
