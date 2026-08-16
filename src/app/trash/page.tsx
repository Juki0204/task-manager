"use client";

import { useEffect, useMemo, useState } from "react";

import { Task } from "@/utils/types/task";

import TaskList from "@/components/TaskList";
import ContextMenu from "@/components/ui/ContextMenu";

import { supabase } from "@/utils/supabase/supabase";

import { useAuth } from "@/app/AuthProvider";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { useTask } from "@/components/providers/TaskProvider";

import { NonRealtimeNotice } from "@/components/common/NonRealtileNotice";
import { PageLayout } from "@/components/layout/PageLayout";

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  taskSerial?: string;
};

export default function TrashTaskPage() {
  const { user } = useAuth();

  const {
    updateTaskStatus,
    deadlineList,

    isPanelOpen,
    openDetail,
    openEdit,
    openCopy,
  } = useTask();

  const { filters } = useTaskListPreferences();

  const [taskList, setTaskList] = useState<Task[]>([]);

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
      if (!prev.visible) {
        return prev;
      }

      return {
        ...prev,
        visible: false,
      };
    });
  };

  //削除済タスク取得
  const getTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "削除済");

    if (error) {
      console.error(error);
      return;
    }

    setTaskList(data ?? []);
  };

  //一覧フィルター
  const filteredTaskList = useMemo(() => {
    return taskList.filter((task) => {
      //クライアント
      const clientMatch = filters.clients.length === 0 ||
        filters.clients.includes(task.client);

      //担当者
      const assigneeMatch = filters.assignees.length === 0 ||
        filters.assignees.some((assignee) => {
          if (assignee === "未担当") {
            return (
              task.manager === "" ||
              task.manager === null
            );
          }

          return (
            task.manager === assignee
          );
        }
        );

      //ステータス
      const statusMatch = filters.statuses.length === 0 ||
        filters.statuses.includes(task.status);

      //キーワード
      const keyword = filters.searchKeywords?.toLowerCase() ?? "";

      const searchMatch = !filters.searchKeywords ||
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

  //初回取得
  useEffect(() => {
    getTasks();
  }, []);

  return (
    <PageLayout
      title="削除済タスク一覧"
      onClick={handleCloseContextMenu}
      actions={
        <NonRealtimeNotice />
      }
    >
      {user && (
        <TaskList
          user={user}
          taskList={filteredTaskList}
          onClick={(task: Task) => {
            // if (isPanelOpen) {
            //   return;
            // }

            if (menu.visible) {
              return;
            }

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