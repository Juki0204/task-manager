"use client";

import { useEffect, useMemo, useState } from "react";

import { Task } from "@/utils/types/task";
import { supabase } from "@/utils/supabase/supabase";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { useAuth } from "@/app/AuthProvider";
import { useTask } from "@/components/providers/TaskProvider";

import { PageLayout } from "@/components/layout/PageLayout";
import { NonRealtimeNotice } from "@/components/common/NonRealtileNotice";
import TaskList from "@/components/TaskList";
import ContextMenu from "@/components/ui/ContextMenu";

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  taskSerial?: string;
};

export default function ImportantTaskPage() {
  const { user } = useAuth();

  const {
    updateTaskStatus,
    deadlineList,

    isPanelOpen,
    openDetail,
    openEdit,
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

  //重要タスク取得
  const getTasks = async () => {
    if (!user) return;

    //重要タスクが1件もない場合 Supabaseの .in() に空配列を渡さない
    if (!user.important_task_id || user.important_task_id.length === 0) {
      setTaskList([]);
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .in("id", user.important_task_id);

    if (error) {
      console.error(error);
      return;
    }

    setTaskList(data ?? []);
  };

  //一覧フィルター
  const filteredTaskList = useMemo(() => {
    return taskList.filter(
      (task) => {
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

  //user変更時に重要タスク再取得
  useEffect(() => {
    getTasks();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.important_task_id]);

  return (
    <PageLayout
      title="重要タスク一覧"
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
          />
        )}
    </PageLayout>
  );
}