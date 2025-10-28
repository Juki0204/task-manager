"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";
import AddTask from "@/components/AddTask";

import PersonalTaskList from "@/components/PersonalTaskList";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Task } from "@/utils/types/task";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "../AuthProvider";
import ContextMenu from "@/components/ui/ContextMenu";
import { AddTaskBtn } from "@/components/ui/Btn";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";

import {
  DndContext,
  DragEndEvent,
  //DragStartEvent,
  useSensor,
  useSensors,
  MouseSensor
} from "@dnd-kit/core";
import { useInvoiceSync } from "@/utils/hooks/useInvoiceSync";



export default function PersonalTaskPage() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { user } = useAuth();
  const { taskList, updateTaskStatus, sortTask, isReady } = useTaskRealtime(user ?? null);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const { syncInvoiceWithTask } = useInvoiceSync();

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

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const sensors = useSensors(mouseSensor);

  // const handleDragStart = (event: DragStartEvent) => {
  //   const { active } = event;
  //   const taskId = active.id;

  //   const task = taskList.find((t) => t.id === taskId);
  //   if (task) {
  //     setInitStatus(task.status);
  //   }
  // }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event;
    if (!user) return;
    if (!over) return;

    if (active.id !== over.id) {
      const taskId = active.id as string;
      const newStatus = over.id as string;
      const prevStatus = active.data.current?.initStatus;

      const formatNewStatus = newStatus === "NotYetStarted" ? "未着手"
        : newStatus === "InProgress" && prevStatus === "確認中" ? "作業中"
          : newStatus === "InProgress" && prevStatus === "作業中" ? "作業中"
            : newStatus === "InProgress" && prevStatus !== "確認中" ? "未着手"
              : newStatus === "Confirm" ? "確認中"
                : newStatus === "Completed" ? "完了"
                  : "";

      const alt = newStatus === "NotYetStarted" ? { manager: null }
        : { manager: user.name }

      console.log(newStatus, prevStatus);
      await updateTaskStatus(taskId, formatNewStatus, prevStatus, alt);
      await syncInvoiceWithTask(taskId, formatNewStatus);
    }
  };

  // 既読処理関数
  const markAsRead = async (taskId: string) => {
    // フロント即時反映
    setUnreadIds((prev) => prev.filter((id) => id !== taskId));

    // Supabase更新
    const updatedIds = unreadIds.filter((id) => id !== taskId);
    await supabase
      .from("users")
      .update({ unread_task_id: updatedIds })
      .eq("id", user?.id);
  };


  useEffect(() => {
    if (activeTask) {
      const updated = taskList.find((t) => t.id === activeTask.id);
      if (updated) setActiveTask(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskList]);


  useEffect(() => {
    if (user?.unread_task_id) {
      setUnreadIds(user.unread_task_id);
    }
  }, [user]);


  if (!isReady) return <p>loading...</p>

  return (
    <div onClick={handleCloseContextMenu} className="cardListStyle group p-1 py-4 sm:p-4 !pt-30 max-w-[1600px] relative overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <div className="flex justify-between items-center">
        <AddTaskBtn onClick={() => { setIsOpen(true); setModalType("add"); }} />
      </div>
      {user &&
        <DndContext
          // onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <PersonalTaskList
            user={user}
            taskList={sortTask(taskList.filter((task) => task.status !== "削除済"))}
            unreadIds={unreadIds}
            onClick={(t: Task) => {
              if (isOpen) return;
              if (menu.visible) return;

              setActiveTask(t);
              setModalType("detail");
              setIsOpen(true);
            }}
            onContextMenu={handleContextMenu}
            sortTask={sortTask}
          />
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
          }, 10);
        }}
        // transition
        className="relative z-50 transition duration-100 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative min-w-sm max-w-xl space-y-4 rounded-2xl bg-neutral-100 p-8 pr-6">
            {modalType === "add" && <AddTask onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }} />}
            {modalType === "detail" && activeTask && user && (
              <TaskDetail
                user={user}
                task={activeTask}
                unreadIds={unreadIds}
                onClose={() => { setIsOpen(false); markAsRead(activeTask.id); setTimeout(() => setModalType(null), 500); }}
                onEdit={() => setModalType("edit")}
              />
            )}

            {modalType === "edit" && activeTask && user && (
              <UpdateTask user={user} task={activeTask} onComplete={() => setModalType("detail")} onCancel={() => setModalType("detail")} onUnlock={unlockTaskHandler} />
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
        />
      )}
    </div>
  );
}
