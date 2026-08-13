"use client";

import { useMemo, useState } from "react";
import { Button, Input, Select } from "@headlessui/react";

import { Search } from "lucide-react";

import { Task } from "@/utils/types/task";
import { supabase } from "@/utils/supabase/supabase";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { useAuth } from "@/app/AuthProvider";
import { useTask } from "@/components/providers/TaskProvider";

import { PageLayout } from "@/components/layout/PageLayout";
import { NonRealtimeNotice } from "@/components/common/NonRealtileNotice";
import TaskList from "@/components/TaskList";
import ContextMenu from "@/components/ui/ContextMenu";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";

type SearchTerms = {
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
  clients: string[];
  assignees: string[];
  keyword: string;
};

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  taskSerial?: string;
};

export default function CompletedTaskPage() {
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
  const [isLoaded, setIsLoaded] = useState(true);

  //検索条件
  const [searchTerms, setSearchTerms] = useState<SearchTerms>({
    startYear: "2025",
    startMonth: "11",
    endYear: "",
    endMonth: "",
    clients: [],
    assignees: [],
    keyword: "",
  });

  //年度セレクト
  const currentYear = new Date().getFullYear();

  const yearOptions = Array.from(
    { length: currentYear - 2025 + 1 },
    (_, index) => 2025 + index
  );

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

  //完了済みタスク取得
  const getTasks = async () => {
    setIsLoaded(false);

    const startMonth = searchTerms.startMonth.padStart(2, "0");
    const endMonth = searchTerms.endMonth.padStart(2, "0");

    const endDate = new Date(Number(searchTerms.endYear), Number(searchTerms.endMonth), 0);
    const endDay = String(endDate.getDate()).padStart(2, "0");

    const start = `${searchTerms.startYear}-${startMonth}-01`;
    const end = `${searchTerms.endYear}-${endMonth}-${endDay}`;

    let query = supabase
      .from("tasks")
      .select("*")
      .gte("finish_date", start)
      .lte("finish_date", end)
      .eq("status", "完了");

    //クライアント
    if (searchTerms.clients.length > 0) {
      query = query.in("client", searchTerms.clients);
    }

    //担当者
    if (searchTerms.assignees.length > 0) {
      query = query.in("manager", searchTerms.assignees);
    }

    //キーワード
    if (searchTerms.keyword) {
      query = query.or(`title.ilike.%${searchTerms.keyword}%,description.ilike.%${searchTerms.keyword}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setIsLoaded(true);
      return;
    }

    setTaskList(data ?? []);
    setIsLoaded(true);
  };

  //グローバルフィルター適用
  //検索パネルで取得した結果に対して、SideMenu側のフィルターをさらに適用
  const filteredTaskList =
    useMemo(() => {
      return taskList.filter((task) => {
        //クライアント
        const clientMatch = filters.clients.length === 0 ||
          filters.clients.includes(task.client);

        //担当者
        const assigneeMatch = filters.assignees.length === 0 ||
          filters.assignees.some((assignee) => {
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

  //完了日順
  const sortedTaskList = useMemo(() => {
    return [...filteredTaskList].sort((a, b) => {
      return (
        new Date(a.finish_date ?? "").getTime() - new Date(b.finish_date ?? "").getTime()
      );
    });
  }, [filteredTaskList]);

  //検索可能状態
  const canSearch =
    Boolean(
      searchTerms.startYear &&
      searchTerms.startMonth &&
      searchTerms.endYear &&
      searchTerms.endMonth
    );

  return (
    <PageLayout
      title="完了済タスク一覧"
      onClick={
        handleCloseContextMenu
      }
      actions={
        <NonRealtimeNotice />
      }
    >
      <div className="flex w-full gap-2 pb-4">
        {/* 検索パネル */}
        <div className="flex w-68 shrink-0 flex-col gap-2 rounded-md bg-neutral-200 p-4 outline -outline-offset-1 outline-neutral-300 dark:bg-neutral-700 dark:outline-none">
          <h2 className="mb-2 w-full text-center text-sm font-bold">絞り込み検索</h2>

          <div className="text-justify text-sm">
            検索負荷軽減のため、期間は必須としています。
            <br />
            項目入力後、「検索ボタン」押下で該当する完了済みタスクが表示されます。
          </div>

          {/* 期間 */}
          <div className="flex flex-col gap-1 border-b border-neutral-300 dark:border-neutral-600 pt-1 pb-4">
            <h3 className="text-sm font-bold">期間</h3>

            <div className="flex items-end gap-1">
              <Select
                value={searchTerms.startYear}
                onChange={(e) => setSearchTerms((prev) => ({
                  ...prev,
                  startYear: e.target.value,
                }))}
                className="rounded-md bg-white px-2 pb-0.75 pt-0.5 outline outline-neutral-300 dark:text-neutral-700">
                <option value="">-</option>

                {yearOptions.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </Select>

              年

              <Select
                value={searchTerms.startMonth}
                onChange={(e) => setSearchTerms((prev) => ({
                  ...prev,
                  startMonth: e.target.value,
                }))}
                className="rounded-md bg-white px-2 pb-0.75 pt-0.5 outline outline-neutral-300 dark:text-neutral-700">
                <option value="">-</option>

                {Array.from({ length: 12 }, (_, index) => {
                  const month = String(index + 1);

                  return (
                    <option key={month} value={month}>{month}</option>
                  );
                })}
              </Select>

              月

              <span className="px-1 text-sm">から</span>
            </div>

            <div className="flex items-end gap-1">
              <Select
                value={searchTerms.endYear}
                onChange={(e) => setSearchTerms((prev) => ({
                  ...prev,
                  endYear: e.target.value,
                }))}
                className="rounded-md bg-white px-2 pb-0.75 pt-0.5 outline outline-neutral-300 dark:text-neutral-700">
                <option value="">-</option>

                {yearOptions.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </Select>

              年

              <Select
                value={searchTerms.endMonth}
                onChange={(e) => setSearchTerms((prev) => ({
                  ...prev,
                  endMonth: e.target.value,
                }))}
                className="rounded-md bg-white px-2 pb-0.75 pt-0.5 outline outline-neutral-300 dark:text-neutral-700">
                <option value="">-</option>

                {Array.from({ length: 12 }, (_, index) => {
                  const month = String(index + 1);

                  return (
                    <option key={month} value={month}>{month}</option>
                  );
                })}
              </Select>

              月

              <span className="px-1 text-sm">まで</span>
            </div>
          </div>

          {/* クライアント */}
          <div className="z-40 flex flex-col gap-1 border-b border-neutral-300 dark:border-neutral-600 pt-1 pb-4 dark:text-neutral-700">
            <h3 className="text-sm font-bold dark:text-neutral-100">クライアント</h3>

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
              onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) => {
                setSearchTerms(
                  (prev) => ({
                    ...prev,

                    clients: e.target.checked
                      ? [...prev.clients, label]
                      : prev.clients.filter((client) => client !== label),
                  })
                );
              }}
              defaultText="店舗を選択"
              width={240}
            />
          </div>

          {/* 作業担当者 */}
          <div className="flex flex-col gap-1 border-b border-neutral-300 dark:border-neutral-600 pt-1 pb-4 dark:text-neutral-700">
            <h3 className="text-sm font-bold dark:text-neutral-100">作業担当者</h3>

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
              onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) => {
                setSearchTerms(
                  (prev) => ({
                    ...prev,

                    assignees: e.target.checked
                      ? [...prev.assignees, label]
                      : prev.assignees.filter((assignee) => assignee !== label),
                  })
                );
              }}
              defaultText="担当者を選択"
              width={240}
            />
          </div>

          {/* キーワード */}
          <div className="flex flex-col gap-1 dark:text-neutral-700 pt-1 pb-4">
            <h3 className="text-sm font-bold dark:text-neutral-100">キーワード</h3>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 w-4 -translate-y-1/2" />

              <Input
                tabIndex={-1}
                type="text"
                value={searchTerms.keyword}
                className="flex w-60 items-center justify-between rounded-md border border-gray-400 bg-neutral-100 px-4 py-1 pl-8 text-sm font-medium placeholder:font-normal placeholder:text-neutral-400 hover:bg-gray-50 focus:outline-none dark:border-gray-300 dark:shadow-sm"
                placeholder="タイトル or 内容"
                onChange={(e) => setSearchTerms((prev) => ({
                  ...prev,
                  keyword: e.target.value,
                }))}
              />
            </div>
          </div>

          <Button
            disabled={!canSearch || !isLoaded}
            onClick={getTasks}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-neutral-900 px-2 py-2 pr-4 text-white hover:opacity-80 data-disabled:opacity-30 data-disabled:cursor-not-allowed"
          >
            {isLoaded ? "検索" : "検索中..."}
          </Button>
        </div>

        {/* タスク一覧 */}
        {user &&
          taskList.length > 0 && (
            <TaskList
              user={user}
              taskList={sortedTaskList}
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
      </div>

      {/* ContextMenu */}
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