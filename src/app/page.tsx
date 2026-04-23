"use client";

// import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Task } from "@/utils/types/task";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import TaskList from "@/components/TaskList";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import CopyTask from "@/components/CopyTask";
import ContextMenu from "@/components/ui/ContextMenu";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "./AuthProvider";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
// import HelpDrawer from "@/components/HelpDrawer";
import { TbReload } from "react-icons/tb";


export default function AllTaskPage() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | "copy" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { user } = useAuth();
  const { taskList, updateTaskStatus, deadlineList, taskSubStatus, resubscribeAll } = useTaskRealtime(user ?? null);
  const health =
    taskSubStatus === "SUBSCRIBED" ? "green" :
      taskSubStatus === "TIMED_OUT" ? "yellow" :
        taskSubStatus === "UNKNOWN" ? "yellow" : "red";

  const { taskListSortType, filters } = useTaskListPreferences();

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
    }
  }

  const filteredTaskList = useMemo(() => {
    return taskList.filter((task) => {
      if (task.status === "完了" || task.status === "削除済") return false;

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
  }, [taskList, filters]);

  const sortTask = (task: Task[]) => {
    const creAtSort = [...task].sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    });

    const sortedTask = creAtSort.sort((a, b) => {
      if (taskListSortType === "byDate") {
        return new Date(a.request_date).getTime() - new Date(b.request_date).getTime();
      };

      if (taskListSortType === "byManager") {
        const managerA = a.manager ? a.manager : "";
        const managerB = b.manager ? b.manager : "";

        // 未担当（空文字）は常に最後に
        if (managerA === "" && managerB !== "") return 1;
        if (managerA !== "" && managerB === "") return -1;

        return managerA.localeCompare(managerB, "ja");
      }

      return 0;
    });

    return sortedTask;
  }

  useEffect(() => {
    if (activeTask) {
      const updated = taskList.find((t) => t.id === activeTask.id);
      if (updated) setActiveTask(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskList]);

  return (
    <div onClick={handleCloseContextMenu} className="p-1 py-4 sm:p-4 sm:pb-2 !pt-26 max-w-[1920px] m-auto overflow-x-hidden text-neutral-700 dark:text-neutral-100">
      <div className="flex justify-between gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-300 dark:border-neutral-700 min-w-375">
        <div className="flex justify-start items-center gap-4">
          <h2 className="flex justify-center items-center gap-1 py-1 text-xl font-bold text-center">
            全体タスク一覧
            {/* <HelpDrawer /> */}
          </h2>
          <div className="flex items-center gap-2 py-0.75 px-1.75 rounded-full bg-neutral-200 dark:bg-neutral-500">
            <span
              className={`h-2.5 w-2.5 rounded-full ${health === "green" ? "bg-emerald-400" : health === "yellow" ? "bg-amber-400" : "bg-rose-400"
                }`}
            />
            <span className="text-xs mr-1">{taskSubStatus}</span>

            {taskSubStatus !== "SUBSCRIBED" && (
              <button
                onClick={resubscribeAll}
                className="flex items-center gap-1 text-xs px-2 pr-3 py-0.25 rounded-full text-white bg-neutral-400 dark:bg-neutral-600 hover:opacity-80"
              >
                <TbReload />
                再購読
              </button>
            )}
          </div>
        </div>

      </div>
      {user &&
        <TaskList
          user={user}
          taskList={sortTask(filteredTaskList)}
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
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 transition-transform duration-300 has-[.mailOpen]:-translate-x-[360px]">
          <DialogPanel className="w-130 relative space-y-4 rounded-2xl bg-neutral-100 p-6 pt-6.5">
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
        ></ContextMenu>
      )}
    </div>
  );
}
