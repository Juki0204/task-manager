"use client";

// import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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


export default function TrashTaskPage() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [taskList, setTaskList] = useState<Task[]>([]);
  const { user } = useAuth();
  const { updateTaskStatus, deadlineList } = useTaskRealtime(user ?? null);
  const { filters } = useTaskListPreferences();

  //console.log(taskList.filter((t) => t.status === "削除済"));
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
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "削除済");

    if (!data) return false;
    setTaskList(data);
  }

  const filteredTaskList = useMemo(() => {
    return taskList.filter((task) => {
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

  useEffect(() => {
    getTasks();
  }, []);



  return (
    <div onClick={handleCloseContextMenu} className="p-1 py-4 sm:p-4 sm:pb-2 !pt-26 m-auto max-w-[1920px] relative overflow-x-hidden">
      <div className="flex justify-between gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-700 min-w-375">
        <div className="flex justify-start items-end gap-4">
          <h2 className="flex justify-center items-center gap-1 py-1 text-white text-xl font-bold text-center">
            削除済タスク一覧
          </h2>
          <span className="text-xs text-white tracking-wide pb-1">※このページではリアルタイム更新は行われません。最新の状態を確認するには、ページを再読み込みしてください。</span>
        </div>

      </div>
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
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 transition-transform duration-300 has-[.mailOpen]:-translate-x-[360px]">
          <DialogPanel className="w-130 relative space-y-4 rounded-2xl bg-neutral-100 p-6 pt-8">
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
    </div>
  );
}
