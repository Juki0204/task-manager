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
import ContextMenu from "@/components/ui/ContextMenu";
import { AddTaskBtn } from "@/components/ui/Btn";


export default function Home() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [taskList, setTaskList] = useState<Task[]>([]);
  const { user, loading } = useAuth();

  const statusPriority: Record<string, number> = {
    "作業中": 3,
    "作業途中": 2,
  };

  const [menu, setMenu] = useState<{
    visible: boolean,
    x: number,
    y: number,
    taskId?: string,
    taskSerial?: string,
  }>({ visible: false, x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, taskId: string, taskSerial: string) => {
    setMenu({ visible: true, x: e.pageX, y: e.pageY, taskId, taskSerial });
  }

  const handleCloseContextMenu = () => {
    if (menu.visible) {
      setMenu({ ...menu, visible: false });
    }
  }

  const unlockTaskHandler = async () => {
    if (!activeTask || !user) return;
    const { data, error } = await supabase
      .from('tasks')
      .update({
        locked_by_id: null,
        locked_by_name: null,
        locked_by_at: null,
      })
      .eq("id", activeTask.id)
      .eq("locked_by_id", user.id);

    if (error) {
      console.log("unlock failed");
    } else {
      console.log("unlocked task: taskId =", activeTask.id);
    }
  }

  const sortTask = (taskList: Task[]) => {
    const sortTaskData = taskList;
    sortTaskData.sort((a, b) => {
      //作業中タスクを上位に
      const priA = statusPriority[a.status] ?? 1;
      const priB = statusPriority[b.status] ?? 1;

      if (priA !== priB) {
        return priB - priA;
      }

      //日付順でソート
      const dataA = new Date(a.requestDate).getTime();
      const dataB = new Date(b.requestDate).getTime();
      return dataA - dataB;
    });

    return sortTaskData;
  }

  const getTasks = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .or(`manager.eq.${user?.name},manager.eq.`) //自分or空
      .not("status", "eq", ["削除済"]);

    if (tasks) {
      // console.log(tasks);
      const statusPriority: Record<string, number> = {
        "作業中": 3,
        "作業途中": 2,
      };
      const taskData: Task[] = tasks.map(task => mapDbTaskToTask(task));
      sortTask(taskData);
      setTaskList(taskData);
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
            setTaskList((prev) => sortTask([...prev, mapDbTaskToTask(payload.new as dbTaskProps)]));
          }
          if (payload.eventType === "UPDATE") {
            // toast.info('タスクが更新されました。');
            setTaskList((prev) =>
              sortTask(prev.map((t) =>
                t.id === payload.new.id ? mapDbTaskToTask(payload.new as dbTaskProps) : t
              ))
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
    <div onClick={handleCloseContextMenu} className="cardListStyle group p-1 py-4 sm:p-4 !pt-21 max-w-[1600px] relative overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <div className="flex justify-between items-center">
        <AddTaskBtn onClick={() => { setIsOpen(true); setModalType("add"); }}></AddTaskBtn>
      </div>
      {user && <PersonalTaskList user={user} taskList={taskList} onClick={(t: Task) => { setIsOpen(true); setActiveTask(t); setModalType("detail"); }} onContextMenu={handleContextMenu}></PersonalTaskList>}

      {/* 共通モーダル */}
      <Dialog open={isOpen} onClose={() => { unlockTaskHandler(); setIsOpen(false); setTimeout(() => setModalType(null), 500); }} transition className="relative z-50 transition duration-300 ease-out data-closed:opacity-0">
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
              <UpdateTask user={user} task={activeTask} onComplete={() => setModalType("detail")} onCancel={() => setModalType("detail")} onUnlock={unlockTaskHandler}></UpdateTask>
            )}
          </DialogPanel>
        </div>
      </Dialog>

      {menu.visible && menu.taskId && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          taskId={menu.taskId ? menu.taskId : ""}
          taskSerial={menu.taskSerial ? menu.taskSerial : ""}
          onClose={handleCloseContextMenu}
        ></ContextMenu>
      )}
    </div>
  );
}
