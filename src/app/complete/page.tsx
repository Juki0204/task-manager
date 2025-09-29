"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";

import { Task } from "@/utils/types/task";
import { Button, Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { FaPlus } from "react-icons/fa6";

import AddTask from "@/components/AddTask";
import TaskList from "@/components/TaskList";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import ContextMenu from "@/components/ui/ContextMenu";

import { dbTaskProps, mapDbTaskToTask } from "@/utils/function/mapDbTaskToTask";
import { supabase } from "@/utils/supabase/supabase";
import { toast } from "sonner";
import { useAuth } from "@/app/AuthProvider";

type taskListStyle = "rowListStyle" | "cardListStyle";

export default function Home() {

  const [taskListStyle, setTaskListStyle] = useState<taskListStyle | null>(null);
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [taskList, setTaskList] = useState<Task[]>([]);
  const { user, loading } = useAuth();

  const [menu, setMenu] = useState<{
    visible: boolean,
    x: number,
    y: number,
    taskId?: string,
    taskSerial?: string,
  }>({ visible: false, x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, taskId: string, taskSerial: string) => {
    console.log(e.clientX, e.clientY);
    setMenu({ visible: true, x: e.clientX, y: e.clientY, taskId, taskSerial });
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

  const getTasks = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq("status", "完了");

    if (tasks) {
      // console.log(tasks);
      const taskData: Task[] = tasks.map(task => mapDbTaskToTask(task));
      taskData.sort((a, b) => {
        const dataA = new Date(a.finishDate ? a.finishDate : "").getTime();
        const dataB = new Date(b.finishDate ? b.finishDate : "").getTime();
        return dataA - dataB;
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
            if (payload.new.status !== "完了") {
              // 削除済みならリストから取り除く
              setTaskList((prev) => prev.filter((t) => t.id !== payload.new.id));
            } else {
              // それ以外は更新として置き換え
              setTaskList((prev) =>
                prev.map((t) =>
                  t.id === payload.new.id ? mapDbTaskToTask(payload.new as dbTaskProps) : t
                )
              );
            }
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
    const saved = localStorage.getItem('taskListStyle');
    if (saved === 'rowListStyle' || saved === 'cardListStyle') {
      setTaskListStyle(saved);
    } else {
      setTaskListStyle('cardListStyle');
    }
  }, []);

  useEffect(() => {
    if (taskListStyle) {
      localStorage.setItem('taskListStyle', taskListStyle);
    }
  }, [taskListStyle]);



  return (
    <div onClick={handleCloseContextMenu} className={`${taskListStyle} group p-1 py-4 sm:p-4 !pt-21 max-w-[1600px] relative`}>
      <div className="flex justify-between items-center relative">
        <select value={taskListStyle ? taskListStyle : "cardListStyle"} onChange={(e) => setTaskListStyle(e.target.value as taskListStyle)} className="w-fit py-1.5 px-3 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25">
          <option value='cardListStyle'>カード型リスト</option>
          <option value='rowListStyle'>列型リスト</option>
        </select>
        <Button onClick={() => { setIsOpen(true); setModalType("add"); }} className="fixed top-19 right-2 z-50 grid place-content-center w-12 aspect-square rounded-full bg-sky-600 px-4 py-2 text-xl text-white font-bold data-active:bg-sky-700 data-hover:bg-sky-500 cursor-pointer"><FaPlus /></Button>
      </div>
      {user && <TaskList user={user} taskList={taskList} onClick={(t: Task) => { setIsOpen(true); setActiveTask(t); setModalType("detail"); }} onContextMenu={handleContextMenu}></TaskList>}

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
