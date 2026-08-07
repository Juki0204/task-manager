"use client";

// import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Task } from "@/utils/types/task";
import { Button, Dialog, DialogBackdrop, DialogPanel, Input, Select } from "@headlessui/react";

import AddTask from "@/components/AddTask";
import TaskList from "@/components/TaskList";
import TaskDetail from "@/components/TaskDetail";
import UpdateTask from "@/components/UpdateTask";
import ContextMenu from "@/components/ui/ContextMenu";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { PageLayout } from "@/components/layout/PageLayout";
import { NonRealtimeNotice } from "@/components/common/NonRealtileNotice";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";
import { Search } from "lucide-react";

interface searchTermsTypes {
  startYear: string,
  startMonth: string,
  endYear: string,
  endMonth: string,
  clients: string[],
  assignees: string[],
  keyword: string,
}

export default function CompletedTaskPage() {
  const [modalType, setModalType] = useState<"add" | "detail" | "edit" | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [isLoaded, setIsLoaded] = useState<boolean>(true);

  const [taskList, setTaskList] = useState<Task[]>([]);
  const { user } = useAuth();
  const { updateTaskStatus, deadlineList } = useTaskRealtime(user ?? null);
  const { filters } = useTaskListPreferences();

  const [searchTerms, setSearchTerms] = useState<searchTermsTypes>({
    startYear: "2025",
    startMonth: "11",
    endYear: "",
    endMonth: "",
    clients: [],
    assignees: [],
    keyword: "",
  });

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
    setIsLoaded(false);
    const sm = searchTerms.startMonth.padStart(2, "0");
    const em = searchTerms.endMonth.padStart(2, "0");

    const start = `${searchTerms.startYear}-${sm}-01`;
    const end = `${searchTerms.endYear}-${em}-31`;

    let query = supabase
      .from("tasks")
      .select("*")
      .gte("finish_date", start)
      .lte("finish_date", end)
      .eq("status", "完了");

    if (searchTerms.clients.length > 0) {
      query = query.in("client", searchTerms.clients);
    }

    if (searchTerms.assignees.length > 0) {
      query = query.in("manager", searchTerms.assignees);
    }

    if (searchTerms.keyword) {
      query = query.or(`title.ilike.%${searchTerms.keyword}%,description.ilike.%${searchTerms.keyword}%`);
    }

    const { data, error } = await query;

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

  return (
    <PageLayout
      title="完了済タスク一覧"
      onClick={handleCloseContextMenu}
      actions={
        <NonRealtimeNotice />
      }
    >

      <div className="pb-4 flex gap-2 w-full max-w-[1876px]">
        <div className="w-68 bg-zinc-300/50 outline dark:outline-none outline-neutral-300 -outline-offset-1 dark:bg-zinc-700 p-4 rounded-xl flex flex-col gap-2">
          <h2 className="w-full text-center font-bold text-sm mb-2">絞り込み検索</h2>

          <div className="text-justify text-sm">検索負荷軽減のため、期間は必須としています。<br />項目入力後、「検索ボタン」押下で該当する完了済みタスクが表示されます。</div>

          <div className="flex flex-col gap-1 pb-3 border-b border-neutral-300">
            <h3 className="font-bold text-sm">期間</h3>
            <div className="flex gap-1 items-end">
              <Select
                onChange={(e) => {
                  setSearchTerms({
                    ...searchTerms,
                    startYear: e.target.value,
                  })
                }}
                className="bg-white outline outline-neutral-300 rounded-md px-2 pt-0.5 pb-0.75 dark:text-neutral-700"
                value={searchTerms.startYear}
              >
                <option value="">-</option>
                <option value="2024">2024</option>
                <option value="2025" defaultChecked>2025</option>
                <option value="2026">2026</option>
              </Select>
              年
              <Select
                onChange={(e) => {
                  setSearchTerms({
                    ...searchTerms,
                    startMonth: e.target.value,
                  })
                }}
                value={searchTerms.startMonth}
                className="bg-white outline outline-neutral-300 rounded-md px-2 pt-0.5 pb-0.75 dark:text-neutral-700"
              >
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
                <option value="11" defaultChecked>11</option>
                <option value="12">12</option>
              </Select>
              月<span className="px-1 text-sm">から</span>
            </div>

            <div className="flex gap-1 items-end">
              <Select
                onChange={(e) => {
                  setSearchTerms({
                    ...searchTerms,
                    endYear: e.target.value,
                  })
                }}
                value={searchTerms.endYear}
                className="bg-white outline outline-neutral-300 rounded-md px-2 pt-0.5 pb-0.75 dark:text-neutral-700"
              >
                <option value="">-</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </Select>
              年
              <Select
                onChange={(e) => {
                  setSearchTerms({
                    ...searchTerms,
                    endMonth: e.target.value,
                  })
                }}
                value={searchTerms.endMonth}
                className="bg-white outline outline-neutral-300 rounded-md px-2 pt-0.5 pb-0.75 dark:text-neutral-700"
              >
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
              月<span className="px-1 text-sm">まで</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 z-40 pb-3 border-b border-neutral-300 dark:text-neutral-700">
            <h3 className="font-bold text-sm dark:text-neutral-100">クライアント</h3>
            <MultiSelectPopover
              options={[
                { id: 1, label: "難波秘密倶楽部" },
                { id: 2, label: "新大阪秘密倶楽部" },
                { id: 3, label: "谷町秘密倶楽部" },
                { id: 4, label: "谷町人妻ゴールデン" },
                { id: 5, label: "梅田人妻秘密倶楽部" },
                { id: 6, label: "梅田ゴールデン" },
                { id: 7, label: "中洲秘密倶楽部" },
                { id: 8, label: "奥様クラブ" },
                { id: 9, label: "快楽玉乱堂" },
              ]}
              selectedLabels={searchTerms.clients}
              onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                setSearchTerms({
                  ...searchTerms,
                  clients: e.target.checked
                    ? [...searchTerms.clients, label]
                    : searchTerms.clients.filter((c) => c !== label)
                })
              }
              defaultText="店舗を選択"
              width={240}
            />
          </div>

          <div className="flex flex-col gap-1 pb-3 border-b border-neutral-300 dark:text-neutral-700">
            <h3 className="font-bold text-sm dark:text-neutral-100">作業担当者</h3>
            <MultiSelectPopover
              options={[
                { id: 1, label: "浜口" },
                { id: 2, label: "飯塚" },
                { id: 3, label: "谷" },
                { id: 4, label: "田口" },
                { id: 5, label: "西谷" },
                { id: 6, label: "岡本" },
                { id: 7, label: "未担当" },
              ]}
              selectedLabels={searchTerms.assignees}
              onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                setSearchTerms({
                  ...searchTerms,
                  assignees: e.target.checked
                    ? [...searchTerms.assignees, label]
                    : searchTerms.assignees.filter((c) => c !== label)
                })
              }
              defaultText="担当者を選択"
              width={240}
            />
          </div>

          <div className="flex flex-col gap-1 dark:text-neutral-700">
            <h3 className="font-bold text-sm dark:text-neutral-100">キーワード</h3>
            <div className="relative">
              <Search className="w-4 absolute top-1/2 left-2 -translate-y-1/2" />
              <Input
                tabIndex={-1}
                type="text"
                className="flex w-60 items-center justify-between rounded-md border border-gray-400 dark:border-gray-300 bg-neutral-100 px-4 pl-8 py-1 text-sm font-medium dark:shadow-sm hover:bg-gray-50 focus:outline-none placeholder:text-neutral-400 placeholder:font-normal"
                placeholder="タイトル or 内容"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;

                  setSearchTerms({
                    ...searchTerms,
                    keyword: value.trim() === "" ? "" : value,
                  });
                }}
              />
            </div>
          </div>

          <Button
            disabled={!searchTerms.startYear || !searchTerms.startMonth || !searchTerms.endYear || !searchTerms.endMonth}
            onClick={getTasks}
            className="w-full flex gap-2 items-center justify-center mt-3 pr-4 rounded-md bg-neutral-900 dark:bg-slate-700 text-white py-2 px-2 cursor-pointer hover:opacity-80 data-disabled:opacity-30"
          >
            検索
          </Button>
        </div>

        {user && taskList.length > 0 &&
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
        }
      </div>

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
