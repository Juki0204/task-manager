"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import { Task } from "@/utils/types/task";
import { supabase } from "@/utils/supabase/supabase";

import { useAuth } from "@/app/AuthProvider";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";

import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import CopyTask from "@/components/CopyTask";
import CancelAlertModal from "@/components/CancelAlertModal";

type TaskModalType = "detail" | "edit" | "copy" | null;

type TaskRealtimeContext = ReturnType<typeof useTaskRealtime>;

interface TaskContextValue extends TaskRealtimeContext {
  activeTask: Task | null;
  modalType: TaskModalType;
  isModalOpen: boolean;

  openDetail: (task: Task) => void;
  openEdit: (task: Task) => void;
  openCopy: (task: Task) => void;
  closeModal: () => void;
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

  //モーダル関連
  const [modalType, setModalType] = useState<TaskModalType>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  //Realtime更新時、モーダル表示中のタスクも最新状態へ更新
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

  //詳細表示
  const openDetail = (task: Task) => {
    setActiveTask(task);
    setModalType("detail");
    setIsModalOpen(true);
  };

  //編集表示
  const openEdit = (task: Task) => {
    const latestTask =
      taskList.find((item) => item.id === task.id) ?? task;

    setActiveTask(latestTask);
    setModalType("edit");
    setIsModalOpen(true);
  };

  //コピー表示
  const openCopy = (task: Task) => {
    const latestTask =
      taskList.find((item) => item.id === task.id) ?? task;

    setActiveTask(latestTask);
    setModalType("copy");
    setIsModalOpen(true);
  };

  //モーダルのstateを初期化
  //Dialogのtransitionが終わる前にmodalTypeをnullにすると
  //中身だけ先に消えるため、少し待ってから初期化
  const resetModal = () => {
    setIsModalOpen(false);

    window.setTimeout(() => {
      setActiveTask(null);
      setModalType(null);
    }, 300);
  };

  //通常のモーダルClose
  //編集中の場合は確認モーダルを表示する
  const closeModal = () => {
    if (modalType === "edit") {
      setIsAlertOpen(true);
      return;
    }

    resetModal();
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
  const handleConfirmCancelEdit = async () => {
    await unlockTask();

    setIsAlertOpen(false);
    resetModal();
  };

  //詳細 → 編集
  const handleEdit = (task: Task) => {
    openEdit(task);
  };

  //編集 → 詳細
  const handleBackToDetail = () => {
    setModalType("detail");
  };

  return (
    <TaskContext.Provider
      value={{
        ...realtime,
        activeTask,
        modalType,
        isModalOpen,
        openDetail,
        openEdit,
        openCopy,
        closeModal,
      }}
    >
      {children}

      {/* タスク共通モーダル */}
      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        className="relative z-100 transition duration-300 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] dark:bg-white/10"
        />

        <div
          className="fixed inset-0 flex w-screen items-center justify-center p-4 transition-transform duration-300 has-[.mailOpen]:-translate-x-[360px]"
        >
          <DialogPanel className="relative w-130 space-y-4 rounded-2xl bg-neutral-100 p-4 pt-4.5 shadow-2xl shadow-black/30 dark:border dark:border-zinc-700 dark:bg-[#2b2b2b]">
            {modalType === "detail" &&
              activeTask &&
              user && (
                <TaskDetail
                  user={user}
                  task={activeTask}
                  onClose={resetModal}
                  onEdit={handleEdit}
                  deadlineList={deadlineList}
                />
              )}

            {modalType === "edit" &&
              activeTask &&
              user && (
                <UpdateTask
                  user={user}
                  task={activeTask}
                  onComplete={handleBackToDetail}
                  onCancel={handleBackToDetail}
                  onUnlock={unlockTask}
                  deadlineList={deadlineList}
                />
              )}

            {modalType === "copy" &&
              activeTask &&
              user && (
                <CopyTask
                  user={user}
                  task={activeTask}
                  onClose={resetModal}
                />
              )}
          </DialogPanel>
        </div>
      </Dialog>

      {/* 編集中キャンセル確認 */}
      <CancelAlertModal
        alertOpen={isAlertOpen}
        onModalClose={handleConfirmCancelEdit}
        onCalcel={() => setIsAlertOpen(false)}
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