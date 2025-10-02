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
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";

import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, MouseSensor } from "@dnd-kit/core";



export default function Home() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { user, loading } = useAuth();
  const { taskList, updateTaskStatus } = useTaskRealtime(user ?? null);
  const [initStatus, setInitStatus] = useState<string | null>(null);

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

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const sensors = useSensors(mouseSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id;

    const task = taskList.find((t) => t.id === taskId);
    if (task) {
      setInitStatus(task.status);
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event;
    if (!user) return;
    if (!over) return;

    if (active.id !== over.id) {
      const taskId = active.id as string;
      const newStatus = over.id as string;
      const prevStatus = active.data.current?.initStatus;
      console.log(prevStatus);

      const formatNewStatus = newStatus === "NotYetStarted" ? "未着手"
        : newStatus === "InProgress" && prevStatus === "確認中" ? "作業中"
          : newStatus === "InProgress" && prevStatus === "作業中" ? "作業中"
            : newStatus === "InProgress" && prevStatus !== "確認中" ? "未着手"
              : newStatus === "Confirm" ? "確認中"
                : newStatus === "Completed" ? "完了"
                  : "";

      updateTaskStatus(taskId, formatNewStatus, prevStatus);

      console.log(over, active);

      if (newStatus === "NotYetStarted") {
        await supabase
          .from('tasks')
          .update({
            manager: "未決定",
            status: "未着手"
          })
          .eq("id", taskId);
      }

      if (newStatus === "InProgress") {
        if (initStatus === "確認中" || initStatus === "作業中") {
          await supabase
            .from('tasks')
            .update({ manager: user.name, status: "作業中" })
            .eq("id", taskId);
        } else {
          await supabase
            .from('tasks')
            .update({ manager: user.name, status: "未着手" })
            .eq("id", taskId);
        }
      }

      if (newStatus === "Confirm") {
        await supabase
          .from('tasks')
          .update({
            manager: user.name,
            status: "確認中"
          })
          .eq("id", taskId);
      }

      if (newStatus === "Completed") {
        await supabase
          .from('tasks')
          .update({
            manager: user.name,
            status: "完了",
            finish_at: new Date().toISOString()
          })
          .eq("id", taskId);
      }
    }
  };

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
      {user &&
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
          <PersonalTaskList
            user={user}
            taskList={taskList}
            onClick={(t: Task) => {
              if (isOpen) return;

              setActiveTask(t);
              setModalType("detail");
              setIsOpen(true);
            }}
            onContextMenu={handleContextMenu}
          ></PersonalTaskList>
        </DndContext>}

      {/* 共通モーダル */}
      <Dialog
        open={isOpen}
        onClose={() => {
          if (modalType === "edit") unlockTaskHandler();
          setIsOpen(false);
          setTimeout(() => {
            setActiveTask(null);
            setModalType(null);
          }, 500);
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
        ></ContextMenu>
      )}
    </div>
  );
}
