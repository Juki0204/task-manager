import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/supabase";
import { Task } from "@/utils/types/task";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";
import { useAuth } from "@/app/AuthProvider";
import { MdAlarm, MdMailOutline } from "react-icons/md";
import { Tooltip } from "react-tooltip";
import { FiPhone } from "react-icons/fi";
import { FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { FaRegBuilding } from "react-icons/fa6";
import { RiCalendarScheduleLine } from "react-icons/ri";

export default function PriorityTasks() {
  const { user } = useAuth();
  const { taskList, deadlineList } = useTaskRealtime(user ?? null);
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);

  const deadlineMap = new Map<string, string>(
    deadlineList.map((d) => [d.task_id, d.date])
  );

  // const filteredTaskList = (task: Task[]) => {
  //   const filtered = task.filter(t => t.request_date === "2026-01-17");
  //   setPriorityTasks(filtered);
  //   setTimeout(() => setIsReady(true), 1000);
  // }

  const filteredTaskList = (task: Task[]) => {
    const filtered = task.filter(t => {
      if (t.manager) return false; //担当者が決まっているタスクは除外
      if (t.status !== "未着手") return false; //未着手じゃないタスクも除外

      //依頼から7日経過
      const requestTime = t.request_date
        ? new Date(`${t.request_date}T00:00:00`).getTime()
        : null;

      const after7Days =
        requestTime !== null &&
        today0.getTime() - requestTime >= 7 * 24 * 60 * 60 * 1000;

      //優先度が「高」or「至急」
      const highPriority = t.priority === "高" || t.priority === "急";

      //期限が設定されている且つ期限日まで3日を切っている
      const deadlineDateStr = deadlineMap.get(t.id); // ← taskのid と deadline.task_id が一致前提
      const deadlineTime = deadlineDateStr
        ? new Date(`${deadlineDateStr}T00:00:00`).getTime()
        : null;

      const threeDaysLeft =
        deadlineTime !== null &&
        deadlineTime >= today0.getTime() &&
        deadlineTime <= today0.getTime() + 3 * 24 * 60 * 60 * 1000;

      return after7Days || highPriority || threeDaysLeft;
    });

    if (filtered.length > 0) {
      setPriorityTasks(filtered);
    }
    setTimeout(() => setIsReady(true), 1000);
  }

  const createAnnotation = (task: Task) => {
    if (task.priority === "高") {
      return "優先度が「高」に設定されています。"
    } else if (task.priority === "急") {
      return "優先度が「至急」に設定されています。"
    }

    //依頼から7日経過
    const requestTime = task.request_date
      ? new Date(`${task.request_date}T00:00:00`).getTime()
      : null;

    const after7Days =
      requestTime !== null &&
      today0.getTime() - requestTime >= 7 * 24 * 60 * 60 * 1000;

    if (after7Days) {
      return "依頼日から1週間以上経過しています。"
    }

    //期限が設定されている且つ期限日まで3日を切っている
    const deadlineDateStr = deadlineMap.get(task.id); // ← taskのid と deadline.task_id が一致前提
    const deadlineTime = deadlineDateStr
      ? new Date(`${deadlineDateStr}T00:00:00`).getTime()
      : null;

    const threeDaysLeft =
      deadlineTime !== null &&
      deadlineTime >= today0.getTime() &&
      deadlineTime <= today0.getTime() + 3 * 24 * 60 * 60 * 1000;

    if (threeDaysLeft) {
      return "期限日まで残り3日を切っています。"
    }

    return null;
  }

  useEffect(() => {
    //確認用
    filteredTaskList(taskList);
  }, [taskList]);

  if (!isReady) return (
    <div className=" h-30 grid place-content-center my-4" aria-label="読み込み中">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );

  if (isReady && priorityTasks.length === 0) return (
    <p className="text-center h-full grid place-content-center tracking-widest">現時点で優先すべきタスクはありません。各々のタスクを進行しましょう。</p>
  );

  return (
    <div className="flex gap-2">
      {priorityTasks.length > 0 && priorityTasks.map(pt => (
        <PriorityTaskCard key={pt.id} task={pt} annotation={createAnnotation(pt)} deadline={deadlineList.filter(d => d.task_id === pt.id)[0]?.date ?? null} />
      ))}
    </div>
  )
}



function PriorityTaskCard({ task, deadline, annotation }: { task: Task, deadline: string | null, annotation: string | null }) {
  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const clientList: Record<string, string> = {
    "難波秘密倶楽部": "難波",
    "新大阪秘密倶楽部": "新大阪",
    "谷町秘密倶楽部": "谷町",
    "谷町人妻ゴールデン": "谷G",
    "梅田人妻秘密倶楽部": "梅田",
    "梅田ゴールデン": "梅G",
    "中洲秘密倶楽部": "中洲",
    "快楽玉乱堂": "玉乱堂",
    "奥様クラブ": "奥様",
    "シードライブ": "ｼｰﾄﾞﾗ",
  }

  const priorityStyles: Record<string, string> = {
    "急": "bg-red-300 text-red-800",
    "高": "bg-orange-300 text-orange-800",
    "低": "bg-emerald-300 text-emerald-800",
  } as const;

  function definePriorityStyle(priority: string | null) {
    if (priority) {
      const style = priorityStyles[priority] ?? ""
      setPriorityStyle(style);
    }
  }

  const statusStyles: Record<string, string> = {
    "未着手": "bg-neutral-300 text-neutral-800",
    "作業中": "bg-blue-300 text-blue-800",
    "作業途中": "bg-blue-200 text-blue-800",
    "確認中": "bg-pink-300 text-pink-800",
    "完了": "bg-green-300 text-green-800",
    "保留": "bg-yellow-300 text-yellow-800",
    "中止": "bg-neutral-600 text-neutral-200",
    "詳細待ち": "bg-neutral-500 text-neutral-200",
  }

  function defineStatusStyle(status: string) {
    const style = statusStyles[status];
    setStatusStyle(style);
  }


  useEffect(() => {
    definePriorityStyle(task.priority);
    defineStatusStyle(task.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);


  return (
    <div
      // onContextMenu={(e) => onContextMenu(e, task.id, task.serial)}
      className="bg-neutral-800 rounded-lg min-w-90 drop-shadow-md drop-shadow-gray-950/30">

      {/* カード（概要） */}
      <div
        id={task.id}
        className={`w-full rounded-sm p-3 text-white tracking-wide relative`}
      >
        {/* {unreadIds && unreadIds.includes(task.id) && (<div className="absolute top-3 left-1.75 w-0.75 h-39.5 bg-[#ffff00] rounded-full" />)} */}
        <div className="flex items-center gap-1 text-sm leading-6 pb-1.5">
          {task.serial}
          {deadline && (
            <>
              <MdAlarm className="text-yellow-300 text-lg -ml-0.5 mt-0.5" data-tooltip-id="deadline" data-tooltip-content={`期日が${deadline.split("-")[1]}月${deadline.split("-")[2]}日に設定されています。`} />
              <Tooltip id="deadline" place="top-start" variant="warning" style={{ color: "#333", fontWeight: "bold", fontSize: "14px", zIndex: 50 }} />
            </>
          )}
        </div>
        <h3 className="font-bold truncate flex items-center gap-1">
          {
            task.method === 'mail' ?
              <MdMailOutline />
              : task.method === 'tel' ?
                <FiPhone />
                :
                <FaRegQuestionCircle />
          }
          {task.title}
        </h3>

        <div className="w-fit flex gap-1 items-center pl-1 absolute top-3 right-3">
          {
            task.priority ?
              <span className={`py-1 px-2 h-fit rounded-sm text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
              :
              <span className="w-7 h-6 opacity-0"></span>
          }
          <span className={`py-1 px-2 h-fit w-16.5 text-center rounded-sm text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
        </div>

        <div className="line-clamp-2 w-full truncate text-sm h-5 mb-2">
          {task.description}
        </div>

        <div className="p-2 rounded-md overflow-hidden relative before:bg-white/40 before:mix-blend-overlay before:w-full before:h-full before:absolute before:top-0 before:left-0">
          <div className="grid gap-2 text-sm grid-cols-6">
            <div className="col-span-3 flex gap-1 items-center"><FaRegBuilding />{clientList[task.client]} 【{task.requester}】</div>
            <div className="col-span-3 flex gap-1 items-center"><RiCalendarScheduleLine />{task.request_date}</div>
          </div>
        </div>

        <div className="w-full text-center pt-1 text-yellow-300 text-sm">{annotation}</div>
      </div>
    </div>
  )
}