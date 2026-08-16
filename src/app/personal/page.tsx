"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Task } from "@/utils/types/task";

import PersonalTaskList from "@/components/PersonalTaskList";
import ContextMenu from "@/components/ui/ContextMenu";

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { supabase } from "@/utils/supabase/supabase";

import { useAuth } from "../AuthProvider";
import { useInvoiceSync } from "@/utils/hooks/useInvoiceSync";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { useTask } from "@/components/providers/TaskProvider";

import { compareHistory } from "@/utils/function/comparHistory";
import { generateChangeMessage } from "@/utils/function/generateChangeMessage";

import { PageLayout } from "@/components/layout/PageLayout";
import { SubscriptionStatus } from "@/components/common/SubscriptionStatus";

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  taskSerial?: string;
};

export default function PersonalTaskPage() {
  const { user } = useAuth();

  const {
    taskList,
    updateTaskStatus,
    sortTask,
    isReady,
    deadlineList,
    taskSubStatus,
    resubscribeAll,

    isPanelOpen,
    openDetail,
    openEdit,
    openCopy,
  } = useTask();

  const { filters, setFilters } = useTaskListPreferences();

  const { syncInvoiceWithTask } = useInvoiceSync();

  //DnD関連
  const [activeContainerId, setActiveContainerId] = useState<string | null>(null);
  const [currentClickTask, setCurrentClickTask] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const [draggingTaskPrevIndex, setDraggingTaskPrevIndex] = useState<number | null>(null);

  const lastDropRef = useRef<{ x: number; y: number } | null>(null);

  const flyAnimationRef = useRef<null | ((taskId: string) => void)>(null);

  //クリック中タスクのハイライト解除用
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  //ContextMenu
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
  });

  const handleContextMenu = (e: React.MouseEvent, taskId: string, taskSerial: string) => {
    setMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      taskId,
      taskSerial,
    });
  };

  const handleCloseContextMenu = () => {
    setMenu((prev) => {
      if (!prev.visible) return prev;

      return {
        ...prev,
        visible: false,
      };
    });
  };

  /**
   * Realtime接続状態
   */
  const health = taskSubStatus === "SUBSCRIBED"
    ? "green"
    : taskSubStatus === "TIMED_OUT" || taskSubStatus === "UNKNOWN"
      ? "yellow"
      : "red";

  //DnD Sensor
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const sensors = useSensors(mouseSensor);

  //ドラッグ開始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    const fromContainer = active.data.current?.data.containerId as | string | undefined;

    setActiveContainerId(fromContainer ?? null);
    setCurrentClickTask(active.id as string);
    setDraggingTaskId(active.id as string);
    setIsDragging(true);

    const index = taskList.findIndex((task) => task.id === active.id);

    setDraggingTaskPrevIndex(index);
  };

  //ドラッグ終了
  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);

    const { over, active } = event;

    if (!user || !over) return;

    if (active.id === over.id) {
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const prevStatus = active.data.current?.initStatus;
    const startContainer = activeContainerId;

    //同一エリア内で 掴む → 離すだけなら更新しない
    if (newStatus === startContainer) {
      return;
    }

    //DnDのcontainerIdから実際のstatusへ変換
    const formatNewStatus =
      newStatus === "NotYetStarted"
        ? "未着手"
        : newStatus === "InProgress" && prevStatus === "確認中"
          ? "作業中"
          : newStatus === "InProgress" && prevStatus === "作業中"
            ? "作業中"
            : newStatus === "InProgress" && prevStatus !== "確認中"
              ? "未着手"
              : newStatus === "Confirm"
                ? "確認中"
                : newStatus === "Completed"
                  ? "完了"
                  : "";

    //未着手へ戻した場合は担当解除
    const alt = newStatus === "NotYetStarted"
      ? { manager: null }
      : { manager: user.name };

    //dnd-kitが計算したドロップ時の絶対座標
    const rect = active.rect.current.translated;
    lastDropRef.current = {
      x: rect?.left ?? 0,
      y: rect?.top ?? 0,
    };

    //1フレーム後にカードの移動Animation開始
    requestAnimationFrame(() => {
      flyAnimationRef.current?.(
        active.id as string
      );
    });

    //タスク更新
    await updateTaskStatus(
      taskId,
      formatNewStatus,
      prevStatus,
      alt
    );

    //請求データ同期
    await syncInvoiceWithTask(
      taskId,
      formatNewStatus
    );

    //変更履歴用データ
    const oldTaskData = active.data.current?.task;

    if (!oldTaskData) return;

    const newTaskData = {
      ...oldTaskData,
      manager:
        newStatus === "NotYetStarted"
          ? ""
          : user.name,
      status: formatNewStatus,
    };

    //差分比較
    const diff = compareHistory(
      newTaskData,
      oldTaskData
    );

    if (diff.changedKeys.length === 0) {
      return;
    }

    const message = generateChangeMessage(
      diff,
      newTaskData
    );

    if (!message) return;

    //変更ログ追加
    const { error } = await supabase
      .from("task_notes")
      .insert({
        task_serial: oldTaskData.serial,
        message,
        diff,
        old_record: oldTaskData,
        new_record: newTaskData,
        changed_by: user.name,
        changed_at: new Date().toISOString(),
        type: "changed",
      });

    if (error) {
      console.error(error);
    }
  };

  //個人タスク一覧フィルタ
  const filteredTaskList = useMemo(() => {
    return taskList.filter(
      (task) => {
        //削除済み除外
        if (task.status === "削除済") {
          return false;
        }

        //クライアント
        const clientMatch = filters.clients.length === 0 ||
          filters.clients.includes(
            task.client
          );

        //担当者 
        //未担当タスクは個人一覧でも表示対象
        const assigneeMatch =
          task.manager === null ||
          task.manager === "" ||
          filters.assignees.length === 0 ||
          filters.assignees.some(
            (assignee) => {
              if (assignee === "未担当") {
                return (
                  task.manager === "" || task.manager === null
                );
              }

              return (
                task.manager === assignee
              );
            }
          );

        //ステータス
        const statusMatch = filters.statuses.length === 0 ||
          filters.statuses.includes(
            task.status
          );

        //キーワード
        const keyword = filters.searchKeywords?.toLowerCase() ?? "";

        const searchMatch =
          !filters.searchKeywords ||
          task.serial?.toLowerCase().includes(keyword) ||
          task.title?.toLowerCase().includes(keyword) ||
          task.description?.toLowerCase().includes(keyword) ||
          task.requester?.toLowerCase().includes(keyword);

        return (
          clientMatch &&
          assigneeMatch &&
          statusMatch &&
          searchMatch
        );
      }
    );
  }, [taskList, filters]);

  //個人ページ初回表示時、自分を担当者フィルタに設定
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (initializedRef.current) {
      return;
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

  //モーダルを閉じてから5秒後にタスクハイライト解除
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);

      timerRef.current = null;
    }

    if (currentClickTask && !isPanelOpen && !isDragging) {
      timerRef.current =
        setTimeout(() => {
          setCurrentClickTask(null);

          timerRef.current = null;
        }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);

        timerRef.current = null;
      }
    };
  }, [currentClickTask, isPanelOpen, isDragging]);

  //Realtime初期化待ち
  if (!isReady) {
    return <p>loading...</p>;
  }

  return (
    <PageLayout
      title="個人タスク一覧"
      onClick={
        handleCloseContextMenu
      }
      titleAreaClassName="items-center"
      titleAddon={
        <SubscriptionStatus
          health={health}
          status={taskSubStatus}
          onResubscribe={
            resubscribeAll
          }
        />
      }
    // actions={<AddTask />}
    >
      {user && (
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <PersonalTaskList
            user={user}
            taskList={sortTask(filteredTaskList)}
            onClick={(task: Task) => {
              // if (isPanelOpen) {
              //   return;
              // }

              if (menu.visible) {
                return;
              }

              setCurrentClickTask(task.id);
              openDetail(task);
            }}
            currentClickTask={currentClickTask}
            onContextMenu={handleContextMenu}
            sortTask={sortTask}
            onEdit={(task: Task) => {
              setCurrentClickTask(task.id);
              openEdit(task);
            }}
            draggingTaskId={draggingTaskId}
            draggingTaskPrevIndex={draggingTaskPrevIndex}
            flyAnimationRef={flyAnimationRef}
            lastDropRef={lastDropRef}
            deadlineList={deadlineList}
          />
        </DndContext>
      )}

      {menu.visible &&
        menu.taskId && (
          <ContextMenu
            x={menu.x}
            y={menu.y}
            taskId={menu.taskId}
            taskSerial={menu.taskSerial ?? ""}
            onClose={handleCloseContextMenu}
            updateTaskStatus={updateTaskStatus}
            onCopyTask={(task) => {
              if (isPanelOpen) {
                return;
              }

              openCopy(task);
            }}
          />
        )}
    </PageLayout>
  );
}