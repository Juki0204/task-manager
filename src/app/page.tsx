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
import CancelAlertModal from "@/components/CancelAlertModal";
import { PageLayout } from "./PageLayout";
import { SubscriptionStatus } from "@/components/common/SubscriptionStatus";


export default function AllTaskPage() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | "copy" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
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
    const today = new Date();

    return taskList.filter((task) => {
      // 削除済は除外
      if (task.status === "削除済") return false;

      // 完了タスクの表示可否
      let completionMatch = true;

      if (task.status === "完了") {
        // finish_dateなしは表示
        if (!task.finish_date) {
          completionMatch = true;
        } else {
          const finishDate = new Date(task.finish_date);

          completionMatch =
            finishDate.getFullYear() === today.getFullYear() &&
            finishDate.getMonth() === today.getMonth() &&
            finishDate.getDate() === today.getDate();
        }
      }

      const clientMatch = filters.clients.length === 0 || filters.clients.includes(task.client);
      const assigneeMatch = filters.assignees.length === 0 ||
        filters.assignees.some((assignee) => {
          if (assignee === "未担当") return task.manager === "";
          return task.manager === assignee;
        });
      const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(task.status);
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
    >

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
        // onClose={() => {
        //   if (modalType === "edit") unlockTaskHandler();
        //   setIsOpen(false);
        //   setTimeout(() => {
        //     setActiveTask(null);
        //     setModalType(null);
        //   }, 10);
        // }}
        onClose={() => {
          if (modalType === "edit") {
            setIsAlertOpen(true);
          } else {
            setIsOpen(false);
            setTimeout(() => {
              setActiveTask(null);
              setModalType(null);
              setIsAlertOpen(false);
            }, 10);
          }
        }}
        // transition
        className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/20 dark:bg-white/10 backdrop-blur-[2px]" />

        <div data-theme="light" className="fixed inset-0 flex w-screen items-center justify-center p-4 transition-transform duration-300 has-[.mailOpen]:-translate-x-[360px]">
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

            {modalType === "copy" && activeTask && user && (
              <CopyTask user={user} task={activeTask} onClose={() => { setIsOpen(false); setTimeout(() => setModalType(null), 500); }}></CopyTask>
            )}
          </DialogPanel>
        </div>
      </Dialog>

      <CancelAlertModal
        alertOpen={isAlertOpen}
        onModalClose={() => {
          unlockTaskHandler();
          setIsOpen(false);
          setTimeout(() => {
            setActiveTask(null);
            setModalType(null);
            setIsAlertOpen(false);
          }, 10);
        }}
        onCalcel={() => setIsAlertOpen(false)}
      />

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
    </PageLayout>
  );
}
