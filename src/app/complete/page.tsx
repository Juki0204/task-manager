"use client";

// import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Task } from "@/utils/types/task";
import { Dialog, DialogBackdrop, DialogPanel, Select } from "@headlessui/react";

import AddTask from "@/components/AddTask";
import TaskList from "@/components/TaskList";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import ContextMenu from "@/components/ui/ContextMenu";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";


export default function CompletedTaskPage() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(true);

  const [taskList, setTaskList] = useState<Task[]>([]);
  const { user } = useAuth();
  const { updateTaskStatus, deadlineList } = useTaskRealtime(user ?? null);
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
      console.log("unlock failed");
    } else {
      console.log("unlocked task: taskId =", activeTask.id);
    }
  }

  const getTasks = async (year: string, month: string) => {
    if (!year || !month) return;
    setIsLoaded(false);
    const m = month.padStart(2, "0");

    const start = `${year}-${m}-01`;
    const end = `${year}-${m}-31`;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "完了")
      .gte("finish_date", start)
      .lte("finish_date", end);

    if (error) {
      console.error(error);
      return false;
    }

    if (!data) return false;
    setTaskList(data);
    setIsLoaded(true);
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

  const sortTask = (task: Task[]) => {
    const sortedTask = [...task].sort((a, b) => {
      return new Date(a.finish_date ?? "").getTime() - new Date(b.finish_date ?? "").getTime();
    });

    return sortedTask;
  }

  useEffect(() => {
    getTasks(year, month);
  }, [year, month]);

  return (
    <div onClick={handleCloseContextMenu} className="p-1 py-4 sm:p-4 sm:pb-20 !pt-30 m-auto max-w-[1920px] relative">
      <div className="flex justify-between gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-700 min-w-375">
        <div className="flex justify-start items-end gap-4">
          <h2 className="flex justify-center items-center gap-1 py-0.25 text-white text-xl font-bold text-center">
            <span className="inline-block mr-2">完了済タスク一覧</span>
            <Select onChange={(e) => setYear(e.target.value)} className="bg-neutral-700 rounded-md px-2 pt-0.5 pb-0.75">
              <option value="">-</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </Select>
            年
            <Select onChange={(e) => setMonth(e.target.value)} className="bg-neutral-700 rounded-md px-2 pt-0.5 pb-0.75">
              <option value="">-</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </Select>
            月度分
          </h2>
          <span className="text-xs text-white tracking-wide pb-1">※このページではリアルタイム更新は行われません。最新の状態を確認するには、ページを再読み込みしてください。</span>
        </div>

      </div>

      {user && taskList.length > 0 ?
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
        />
        :
        month && year && isLoaded ?
          <div className="text-center text-white">該当するタスクがありません。</div>
          :
          !isLoaded ?
            <div className="text-center text-white">取得中...</div>
            :
            <div className="text-center text-white">年月を選択すると該当月分の完了済みタスクが閲覧できます。</div>
      }

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

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
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
