"use client";

import {
  useMemo,
  useState,
} from "react";

import { Task } from "@/utils/types/task";

import TaskList from "@/components/TaskList";
import ContextMenu from "@/components/ui/ContextMenu";
import AddTask from "@/components/AddTask";

import { useAuth } from "./AuthProvider";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { useTask } from "@/components/providers/TaskProvider";

import { PageLayout } from "@/components/layout/PageLayout";
import { SubscriptionStatus } from "@/components/common/SubscriptionStatus";

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  taskSerial?: string;
};

export default function AllTaskPage() {
  const { user } = useAuth();

  const {
    taskList,
    updateTaskStatus,
    deadlineList,
    taskSubStatus,
    resubscribeAll,

    isModalOpen,
    openDetail,
    openEdit,
    openCopy,
  } = useTask();

  const { taskListSortType, filters } = useTaskListPreferences();

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

  //Realtime接続状態
  const health = taskSubStatus === "SUBSCRIBED"
    ? "green"
    : taskSubStatus === "TIMED_OUT" || taskSubStatus === "UNKNOWN"
      ? "yellow"
      : "red";

  //フィルタリング
  const filteredTaskList = useMemo(() => {
    const today = new Date();

    return taskList.filter((task: Task) => {
      // 削除済み
      if (task.status === "削除済") {
        return false;
      }

      //完了済みタスク
      //当日完了分のみ表示
      let completionMatch = true;

      if (task.status === "完了") {
        if (!task.finish_date) {
          completionMatch = true;
        } else {
          const finishDate =
            new Date(task.finish_date);

          completionMatch =
            finishDate.getFullYear() ===
            today.getFullYear() &&
            finishDate.getMonth() ===
            today.getMonth() &&
            finishDate.getDate() ===
            today.getDate();
        }
      }

      //クライアント
      const clientMatch = filters.clients.length === 0 || filters.clients.includes(task.client);

      //担当者
      const assigneeMatch = filters.assignees.length === 0 || filters.assignees.some((assignee) => {
        if (assignee === "未担当") {
          return task.manager === "";
        }

        return (
          task.manager === assignee
        );
      });

      //ステータス
      const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(task.status);

      //キーワード
      const keyword = filters.searchKeywords?.toLowerCase() ?? "";

      const searchMatch = !filters.searchKeywords ||
        task.serial?.toLowerCase().includes(keyword) ||
        task.title?.toLowerCase().includes(keyword) ||
        task.description?.toLowerCase().includes(keyword) ||
        task.requester?.toLowerCase().includes(keyword);

      return (
        completionMatch &&
        clientMatch &&
        assigneeMatch &&
        statusMatch &&
        searchMatch
      );
    });
  }, [taskList, filters]);

  //ソート
  const sortedTaskList = useMemo(() => {
    return [...filteredTaskList].sort(
      (a, b) => {
        if (taskListSortType === "byDate") {
          const requestDateDiff = new Date(a.request_date).getTime() - new Date(b.request_date).getTime();

          //request_dateが同一の場合はcreated_at順
          if (requestDateDiff !== 0) {
            return requestDateDiff;
          }

          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }

        if (taskListSortType === "byManager") {
          const managerA = a.manager ?? "";
          const managerB = b.manager ?? "";

          //未担当は最後
          if (managerA === "" && managerB !== "") {
            return 1;
          }

          if (managerA !== "" && managerB === "") {
            return -1;
          }

          const managerDiff = managerA.localeCompare(managerB, "ja");

          //同担当者の場合はcreated_at順
          if (managerDiff !== 0) {
            return managerDiff;
          }

          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }

        return 0;
      }
    );
  }, [filteredTaskList, taskListSortType]);

  return (
    <PageLayout
      title="全体タスク一覧"
      onClick={handleCloseContextMenu}
      titleAreaClassName="items-center"
      titleAddon={
        <SubscriptionStatus
          health={health}
          status={taskSubStatus}
          onResubscribe={resubscribeAll}
        />
      }
      actions={<AddTask />}
    >
      {user && (
        <TaskList
          user={user}
          taskList={sortedTaskList}
          onClick={(task: Task) => {
            if (isModalOpen) return;
            if (menu.visible) return;

            openDetail(task);
          }}
          onContextMenu={handleContextMenu}
          onEdit={openEdit}
          deadlineList={deadlineList}
        />
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
            onCopyTask={openCopy}
          />
        )}
    </PageLayout>
  );
}