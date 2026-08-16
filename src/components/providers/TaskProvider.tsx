"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { Task } from "@/utils/types/task";
import { supabase } from "@/utils/supabase/supabase";

import { useAuth } from "@/app/AuthProvider";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";

import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import CancelAlertModal from "@/components/CancelAlertModal";
import AddTask from "../AddTask";

type TaskPanelType = "add" | "detail" | "edit" | "copy" | null;

type TaskRealtimeContext = ReturnType<typeof useTaskRealtime>;

type PendingPanel = {
  type: TaskPanelType;
  task?: Task | null;
};

interface TaskContextValue extends TaskRealtimeContext {
  activeTask: Task | null;
  panelType: TaskPanelType;
  isPanelOpen: boolean;

  openAdd: () => void;
  openDetail: (task: Task) => void;
  openEdit: (task: Task) => void;
  openCopy: (task: Task) => void;
  closePanel: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

interface TaskProviderProps {
  children: ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const { user } = useAuth();

  //タスクRealtime関連
  const realtime = useTaskRealtime(user ?? null);

  const { taskList, deadlineList } = realtime;

  //ドロワー関連
  const [panelType, setPanelType] = useState<TaskPanelType>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pendingPanel, setPendingPanel] = useState<PendingPanel | null>(null);

  //Realtime更新時、ドロワー表示中のタスクも最新状態へ更新
  useEffect(() => {
    if (!activeTask) return;

    const updatedTask = taskList.find(
      (task) => task.id === activeTask.id
    );

    if (!updatedTask) return;

    setActiveTask(updatedTask);

    // activeTask自身をdependencyにすると
    // setActiveTask → effect のループになりやすいためIDのみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskList, activeTask?.id]);


  //ドロワーを開く処理
  const applyPanelChange = (type: TaskPanelType, task?: Task | null) => {
    if (type === null) {
      resetPanel();
      return;
    }

    if (type === "add") {
      setActiveTask(null);
      setPanelType("add");
      setIsPanelOpen(true);
      return;
    }

    if (!task) return;

    const latestTask = taskList.find((item) => item.id === task.id) ?? task;

    setActiveTask(latestTask);
    setPanelType(type);
    setIsPanelOpen(true);
  };

  //ドロワー切り替え判定
  const requestPanelChange = (type: TaskPanelType, task?: Task | null) => {
    if (isPanelOpen && panelType !== "detail") {
      setPendingPanel({ type, task });

      setIsAlertOpen(true);
      return;
    }

    applyPanelChange(type, task);
  };

  //新規追加
  const openAdd = () => {
    requestPanelChange("add");
  }

  //詳細表示
  const openDetail = (task: Task) => {
    requestPanelChange("detail", task);
  };

  //編集表示
  const openEdit = (task: Task) => {
    requestPanelChange("edit", task);
  };

  //コピー表示
  const openCopy = (task: Task) => {
    requestPanelChange("copy", task);
  };


  //ドロワーのstateを初期化
  //Dialogのtransitionが終わる前にmodalTypeをnullにすると
  //中身だけ先に消えるため、少し待ってから初期化
  const resetPanel = () => {
    setIsPanelOpen(false);

    window.setTimeout(() => {
      setActiveTask(null);
      setPanelType(null);
    }, 300);
  };

  //通常のドロワーClose
  //詳細表示以外の場合は確認モーダルを表示する
  const closePanel = () => {
    if (panelType !== "detail") {
      setPendingPanel({ type: null });

      setIsAlertOpen(true);
      return;
    }

    resetPanel();
  };

  //タスク編集ロック解除
  const unlockTask = async () => {
    if (!activeTask || !user) return;

    const { error } = await supabase
      .from("tasks")
      .update({
        locked_by_id: null,
        locked_by_name: null,
        locked_by_at: null,
      })
      .eq("id", activeTask.id)
      .eq("locked_by_id", user.id);

    if (error) {
      console.error("unlock failed", error);
    }
  };

  //編集キャンセル確認
  const handleConfirmPanelChange = async () => {
    if (panelType === "edit") {
      await unlockTask();
    }

    setIsAlertOpen(false);

    if (pendingPanel) {
      const { type, task } = pendingPanel;

      setPendingPanel(null);

      if (type === null) {
        resetPanel();
        return;
      }

      applyPanelChange(type, task);
      return;
    }

    resetPanel();
  };

  //詳細 → 編集
  const handleEdit = (task: Task) => {
    openEdit(task);
  };

  //編集 → 詳細（編集キャンセル時）
  const handleEditCancel = () => {
    if (!activeTask) return;

    requestPanelChange("detail", activeTask);
  };

  //編集 → 詳細（編集完了時）
  const handleEditComplete = () => {
    if (!activeTask) return;

    applyPanelChange("detail", activeTask);
  };

  return (
    <TaskContext.Provider
      value={{
        ...realtime,

        activeTask,
        panelType,
        isPanelOpen,

        openAdd,
        openDetail,
        openEdit,
        openCopy,
        closePanel,
      }}
    >
      {children}

      {/* タスク共通ドロワー */}
      <div
        className={`
          fixed right-0 top-0 z-110
          h-svh w-[520px] p-4 pb-30
          bg-white dark:bg-neutral-800
          shadow-xl
          transition-transform duration-300
          ${isPanelOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {panelType === "add" && user && (
          <AddTask
            onClose={closePanel}
            onComplete={resetPanel}
          />
        )}

        {panelType === "detail" &&
          activeTask &&
          user && (
            <TaskDetail
              user={user}
              task={activeTask}
              onClose={closePanel}
              onEdit={handleEdit}
              deadlineList={deadlineList}
            />
          )}

        {panelType === "edit" &&
          activeTask &&
          user && (
            <UpdateTask
              user={user}
              task={activeTask}
              onComplete={handleEditComplete}
              onCancel={handleEditCancel}
              onUnlock={unlockTask}
              deadlineList={deadlineList}
            />
          )}

        {panelType === "copy" &&
          activeTask &&
          user && (
            <AddTask
              task={activeTask}
              onClose={closePanel}
              onComplete={resetPanel}
            />
          )}
      </div>

      {/* 編集中キャンセル確認 */}
      <CancelAlertModal
        alertOpen={isAlertOpen}
        onModalClose={handleConfirmPanelChange}
        onCalcel={() => {
          setIsAlertOpen(false);
          setPendingPanel(null);
        }}
      />
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);

  if (!context) {
    throw new Error(
      "useTask must be used within TaskProvider"
    );
  }

  return context;
}