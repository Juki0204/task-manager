"use client";

// import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import AddTask from "@/components/AddTask";

import PersonalTaskList from "@/components/PersonalTaskList";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Task } from "@/utils/types/task";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import CopyTask from "@/components/CopyTask";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "../AuthProvider";
import ContextMenu from "@/components/ui/ContextMenu";
import { AddTaskBtn } from "@/components/ui/Btn";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  MouseSensor
} from "@dnd-kit/core";
import { useInvoiceSync } from "@/utils/hooks/useInvoiceSync";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";



export default function PersonalTaskPage() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | "copy" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeContainerId, setActiveContainerId] = useState<string | null>(null);

  const [currentClickTask, setCurrentClickTask] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout>(null);

  const { user } = useAuth();
  const { taskList, updateTaskStatus, sortTask, isReady, deadlineList } = useTaskRealtime(user ?? null);
  const { filters, setFilters } = useTaskListPreferences();
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const { syncInvoiceWithTask } = useInvoiceSync();

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const lastDropRef = useRef<{ x: number, y: number } | null>(null);
  const flyAnimationRef = useRef<null | ((taskId: string) => void)>(null);
  const [draggingTaskPrevIndex, setDraggingTaskPrevIndex] = useState<number | null>(null);

  const [menu, setMenu] = useState<{
    visible: boolean,
    x: number,
    y: number,
    taskId?: string,
    taskSerial?: string,
  }>({ visible: false, x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, taskId: string, taskSerial: string) => {
    setMenu({ visible: true, x: e.pageX, y: e.pageY, taskId, taskSerial });
    console.log(e);
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    const fromContainer = active.data.current?.data.containerId as string | undefined;

    setActiveContainerId(fromContainer ?? null);
    setCurrentClickTask(active.id as string);

    setDraggingTaskId(active.id as string);
    setIsDragging(true);

    const idx = taskList.findIndex((t) => t.id === active.id);
    setDraggingTaskPrevIndex(idx);
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);

    const { over, active } = event;
    if (!user || !over) return;

    if (active.id !== over.id) {
      const taskId = active.id as string;
      const newStatus = over.id as string;
      const prevStatus = active.data.current?.initStatus;

      const startContainer = activeContainerId; //ドラッグ開始エリア検知

      if (newStatus === startContainer) return; //同一エリア内で 掴む→離す は無駄な状態更新せず

      const formatNewStatus = newStatus === "NotYetStarted" ? "未着手"
        : newStatus === "InProgress" && prevStatus === "確認中" ? "作業中"
          : newStatus === "InProgress" && prevStatus === "作業中" ? "作業中"
            : newStatus === "InProgress" && prevStatus !== "確認中" ? "未着手"
              : newStatus === "Confirm" ? "確認中"
                : newStatus === "Completed" ? "完了"
                  : "";

      const alt = newStatus === "NotYetStarted" ? { manager: null }
        : { manager: user.name }

      //dnd-kit が計算した "現在地の絶対座標"
      const rect = active.rect.current.translated;
      lastDropRef.current = { x: rect?.left ?? 0, y: rect?.top ?? 0 };

      // ★ 1フレーム後にカードへ命令を送る
      requestAnimationFrame(() => {
        if (flyAnimationRef.current) {
          flyAnimationRef.current(active.id as string);
        }
      });

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


  const filteredTaskList = taskList.filter((task) => {
    if (task.status === "削除済") return false;

    const clientMatch = filters.clients.length === 0 || filters.clients.includes(task.client);
    const assigneeMatch = task.manager === null || task.manager === "" || filters.assignees.length === 0 || filters.assignees.some((assignee) => {
      if (assignee === "未担当") return task.manager === "";
      return task.manager === assignee;
    });
    const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(task.status);

    const searchMatch =
      !filters.searchKeywords ||
      task.serial?.toLowerCase().includes(filters.searchKeywords.toLowerCase()) ||
      task.title?.toLowerCase().includes(filters.searchKeywords.toLowerCase()) ||
      task.description?.toLowerCase().includes(filters.searchKeywords.toLowerCase()) ||
      task.requester?.toLowerCase().includes(filters.searchKeywords.toLowerCase());

    return clientMatch && assigneeMatch && statusMatch && searchMatch;
  });


  useEffect(() => {
    if (activeTask) {
      const updated = taskList.find((t) => t.id === activeTask.id);
      if (updated) setActiveTask(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskList]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!user) return;
    if (initializedRef.current) return;

    if (user.unread_task_id) {
      setUnreadIds(user.unread_task_id);
    }

    setFilters({
      clients: [],
      assignees: [user.name],
      statuses: [],
      searchKeywords: null,
    });

    initializedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  //5秒後にタスクのハイライトを解除
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentClickTask && !isOpen && !isDragging) {
      timerRef.current = setTimeout(() => {
        setCurrentClickTask(null);
        timerRef.current = null;
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [currentClickTask, isOpen, isDragging]);


  if (!isReady) return <p>loading...</p>

  return (
    <div onClick={handleCloseContextMenu} className="cardListStyle p-1 py-4 sm:p-4 sm:pb-20 !pt-30 mx-auto max-w-[1920px]">
      <div className="flex justify-between gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-700 min-w-375">
        <div className="flex justify-start items-end gap-4">
          <h2 className="flex justify-center items-center gap-1 py-1 text-white text-xl font-bold text-center">
            個人タスク一覧
          </h2>
        </div>

        <div className="flex gap-2">
          <AddTaskBtn onClick={() => { setIsOpen(true); setModalType("add"); }} />
        </div>
      </div>
      {user &&
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <PersonalTaskList
            user={user}
            taskList={sortTask(filteredTaskList)}
            unreadIds={unreadIds}
            onClick={(t: Task) => {
              if (isOpen) return;
              if (menu.visible) return;

              setActiveTask(t);
              setCurrentClickTask(t.id);
              setModalType("detail");
              setIsOpen(true);
            }}
            currentClickTask={currentClickTask}
            onContextMenu={handleContextMenu}
            sortTask={sortTask}
            onEdit={(t: Task) => {
              setActiveTask(t);
              setCurrentClickTask(t.id);
              setModalType("edit");
              setIsOpen(true);
            }}
            draggingTaskId={draggingTaskId}
            draggingTaskPrevIndex={draggingTaskPrevIndex}
            flyAnimationRef={flyAnimationRef}
            lastDropRef={lastDropRef}
            deadlineList={deadlineList}
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
          <DialogPanel className="w-130 relative space-y-4 rounded-2xl bg-neutral-100 p-6 pt-8">
            {modalType === "add" && <AddTask onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }} />}
            {modalType === "detail" && activeTask && user && (
              <TaskDetail
                user={user}
                task={activeTask}
                unreadIds={unreadIds}
                onClose={() => { setIsOpen(false); markAsRead(activeTask.id); setTimeout(() => setModalType(null), 500); }}
                onEdit={() => setModalType("edit")}
                deadlineList={deadlineList}
              />
            )}

            {modalType === "edit" && activeTask && user && (
              <UpdateTask
                user={user}
                task={activeTask}
                onComplete={() => setModalType("detail")}
                onCancel={() => setModalType("detail")}
                onUnlock={unlockTaskHandler}
                deadlineList={deadlineList}
              />
            )}
            {modalType === "copy" && activeTask && user && (
              <CopyTask user={user} task={activeTask} onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }}></CopyTask>
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
          onCopyTask={(t) => {
            if (isOpen) return;

            setActiveTask(t);
            setModalType('copy');
            setIsOpen(true);
          }}
        />
      )}
    </div>
  );
}
