"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";

import { Task } from "@/utils/types/task";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import TaskList from "@/components/TaskList";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import ContextMenu from "@/components/ui/ContextMenu";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { NonRealtimeNotice } from "@/components/common/NonRealtileNotice";
import { PageLayout } from "@/components/layout/PageLayout";


export default function TrashTaskPage() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { user } = useAuth();
  const { updateTaskStatus, deadlineList } = useTaskRealtime(user ?? null);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const { filters } = useTaskListPreferences();

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
      console.error("unlock failed");
    }
    // else {
    //   console.log("unlocked task: taskId =", activeTask.id);
    // }
  }

  const getTasks = async () => {
    if (!user) return;
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .in("id", user.important_task_id);

    if (!tasks) return;
    setTaskList(tasks);
  }

  const filteredTaskList = taskList.filter((task) => {
    const clientMatch = filters.clients.length === 0 || filters.clients.includes(task.client);
    const assigneeMatch = filters.assignees.length === 0 || filters.assignees.some((assignee) => {
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
    getTasks();
  }, [user])


  return (
    <PageLayout
      title="重要タスク一覧"
      onClick={handleCloseContextMenu}
      actions={
        <NonRealtimeNotice />
      }
    >

      {user &&
        <TaskList
          user={user}
          taskList={filteredTaskList}
          onClick={(t: Task) => {
            if (isOpen) return;
            if (menu.visible) return;

            setActiveTask(t);
            setModalType("detail");
            setIsOpen(true);
          }}
          onContextMenu={handleContextMenu}
          onEdit={(t: Task) => {
            setActiveTask(t);
            setModalType("edit");
            setIsOpen(true);
          }}
          deadlineList={deadlineList}
        />}

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
        className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/20 dark:bg-white/10 backdrop-blur-[2px]" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 transition-transform duration-300 has-[.mailOpen]:-translate-x-[360px]">
          <DialogPanel className="w-130 relative space-y-4 rounded-2xl bg-neutral-100 dark:bg-[#2b2b2b] dark:border dark:border-zinc-700 p-4 pt-4.5 shadow-2xl shadow-black/30">
            {modalType === "detail" && activeTask && user && (
              <TaskDetail
                user={user}
                task={activeTask}
                onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }}
                onEdit={(t: Task) => {
                  const latest = taskList.find(x => x.id === t.id) ?? t;
                  setActiveTask(latest);
                  setModalType("edit");
                }}
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
    </PageLayout>
  );
}
