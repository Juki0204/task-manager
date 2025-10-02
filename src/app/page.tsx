"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";

import { Task } from "@/utils/types/task";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import AddTask from "@/components/AddTask";
import TaskList from "@/components/TaskList";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import ContextMenu from "@/components/ui/ContextMenu";
import { AddTaskBtn } from "@/components/ui/Btn";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "./AuthProvider";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";

type taskListStyle = "rowListStyle" | "cardListStyle";

export default function Home() {
  const [taskListStyle, setTaskListStyle] = useState<taskListStyle | null>(null);
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { user } = useAuth();
  const { taskList, updateTaskStatus } = useTaskRealtime(user ?? null);

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
    const { error } = await supabase
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

  useEffect(() => {
    if (activeTask) {
      const updated = taskList.find((t) => t.id === activeTask.id);
      if (updated) setActiveTask(updated);
    }
  }, [taskList]);

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
        <AddTaskBtn onClick={() => { setIsOpen(true); setModalType("add"); }}></AddTaskBtn>
      </div>
      {user &&
        <TaskList
          user={user}
          taskList={taskList}
          onClick={(t: Task) => {
            if (isOpen) return;

            setActiveTask(t);
            setModalType("detail");
            setIsOpen(true);
          }}
          onContextMenu={handleContextMenu}
        ></TaskList>}

      {/* 共通モーダル */}
      <Dialog
        open={isOpen}
        onClose={() => {
          if (modalType === "edit") unlockTaskHandler();
          setIsOpen(false);
          setTimeout(() => {
            setActiveTask(null);
            setModalType(null);
          }, 400);
        }}
        transition
        className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
      >
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
          updateTaskStatus={updateTaskStatus}
        ></ContextMenu>
      )}
    </div>
  );
}
