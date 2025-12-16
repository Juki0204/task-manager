import { FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { RiCalendarScheduleLine, RiFlag2Fill } from "react-icons/ri";
import { MdAlarm, MdMailOutline } from "react-icons/md";
import { FiPhone } from "react-icons/fi";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Task } from "@/utils/types/task";
import { useDraggable } from "@dnd-kit/core";
import { useTaskPresence } from "@/utils/hooks/useTaskPresence";
import { User } from "@/utils/types/user";
import { supabase } from "@/utils/supabase/supabase";
import { toast } from "sonner";
import HighlightText from "./ui/HighlightText";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { FaRegBuilding } from "react-icons/fa6";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";
import { Tooltip } from "react-tooltip";

interface CardPropd {
  task: Task;
  user: User;
  unreadIds: string[];
  onClick: (task: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
  data: { containerId: string };
  currentClickTask: string | null;
  onEdit: (task: Task) => void;
  isDraggable: boolean;
  draggingTaskId: string | null;
  draggingTaskPrevIndex: number | null;
  index: number;
  flyAnimationRef: React.RefObject<((taskId: string) => void) | null>;
  lastDropRef: React.RefObject<{ x: number, y: number } | null>;
}

export default function PersonalCard({
  task,
  user,
  unreadIds,
  onClick,
  onContextMenu,
  data,
  currentClickTask,
  onEdit,
  isDraggable,
  draggingTaskId,
  draggingTaskPrevIndex,
  index,
  flyAnimationRef,
  lastDropRef,
  ...props
}: CardPropd) {
  const editingUser = useTaskPresence(task.id, { id: user.id, name: user.name }, false); //タスクステータスの監視
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { task, initStatus: task.status, data }, disabled: !isDraggable });
  const { filters } = useTaskListPreferences();

  const cardRef = useRef<HTMLDivElement>(null);

  const draggableStyle = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [personalBorder, setPersonalBorder] = useState<string>('');
  const [personalBg, setPersonalBg] = useState<string>('');

  const { deadlineList } = useTaskRealtime(user || null);
  const currentDeadline = deadlineList.filter(d => d.task_id === task.id)[0];

  const clientList: Record<string, string> = {
    "難波秘密倶楽部": "難波",
    "新大阪秘密倶楽部": "新大阪",
    "谷町秘密倶楽部": "谷町",
    "谷町人妻ゴールデン": "谷G",
    "梅田人妻秘密倶楽部": "梅田",
    "梅田ゴールデン": "梅G",
    "中洲秘密倶楽部": "中州",
    "快楽玉乱堂": "玉乱堂",
    "奥様クラブ": "奥様",
    "シードライブ": "ｼｰﾄﾞﾗ",
  }

  //カードアニメーション（戻る・飛ぶ）
  useLayoutEffect(() => {
    // 親が「飛べ！」と命令した時に発火する関数を登録
    flyAnimationRef.current = (taskId: string) => {
      if (taskId !== task.id) return;

      const el = cardRef.current;
      if (!el) return;
      const from = lastDropRef.current;
      if (!from) return;

      const now = el.getBoundingClientRect();

      const dx = from.x - now.left;
      const dy = from.y - now.top;

      //一旦ワープ
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;

      //次フレームで 0,0 に戻す
      requestAnimationFrame(() => {
        el.style.transition = "transform 200ms ease";
        el.style.transform = "translate(0,0)";

        //終了後に transition 削除
        setTimeout(() => {
          el.style.transition = "";
        }, 220);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //カードアニメーション（詰める）
  useEffect(() => {
    if (draggingTaskPrevIndex == null) return;
    if (isDragging) return;
    if (draggingTaskId === task.id) return;

    const el = cardRef.current;
    if (!el) return;

    if (index > draggingTaskPrevIndex) {
      const dy = -80; // カードの高さぶんズラす ※後で動的に計算も可能

      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;

      requestAnimationFrame(() => {
        el.style.transition = "transform 200ms ease";
        el.style.transform = "translateY(0)";
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, draggingTaskPrevIndex, draggingTaskId, isDragging]);


  const managerStyles: Record<string, { border: string; bg: string; }> = {
    "谷": { border: "taniBorder", bg: "taniBg" },
    "飯塚": { border: "iiBorder", bg: "iiBg" },
    "浜口": { border: "hamaBorder", bg: "hamaBg" },
    "田口": { border: "taguBorder", bg: "taguBg" },
    "西谷": { border: "nishiBorder", bg: "nishiBg" },
  } as const;

  function definePersonalColor(manager: string) {
    const style = managerStyles[manager] ?? {
      border: "defaultBorder",
      bg: "defaultBg",
    };

    setPersonalBorder(style.border);
    setPersonalBg(style.bg);
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
    definePersonalColor(task.manager ? task.manager : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);


  //編集ロック
  const lockedTaskHandler = async () => {
    const { data } = await supabase
      .from('tasks')
      .update({
        locked_by_id: user.id,
        locked_by_name: user.name,
        locked_by_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .is("locked_by_id", null)
      .select();

    if (!data?.length) {
      toast.error('他のユーザーが編集中です');
      return;
    }

    console.log("locked task: taskId =", task.id);
  }

  // クリック判定(シングル・ダブル)
  const DOUBLE_CLICK_GRACE = 200;
  const timerRef = useRef<NodeJS.Timeout>(null);
  const handleDoubleClick = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    //console.log("ダブルクリックです");
    lockedTaskHandler();
    if (!editingUser) {
      onEdit(task);
    }
  }

  const handleSingleClick = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    timerRef.current = setTimeout(() => {
      //console.log("シングルクリックです");
      onClick(task);
      timerRef.current = null;
    }, DOUBLE_CLICK_GRACE);
  }

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        cardRef.current = el;
      }}
      {...listeners}
      {...attributes}
      style={draggableStyle}
      onContextMenu={(e) => onContextMenu(e, task.id, task.serial)}
      className={`${task.locked_by_id ? "rolling-border after:rounded-md before:rounded-md" : `static-border ${personalBorder}`} ${task.status === "作業中" ? "inprogress" : ""} rounded-md min-w-90 drop-shadow-md drop-shadow-gray-950/30 hover:brightness-125 ${draggingTaskId === task.id ? "!z-10" : ""} ${isDragging ? "" : "transition-all duration-200"}`}>

      {task.locked_by_id && <div className="editing-overlay"><span className="editing-overlay-text">{task.locked_by_name}さんが編集中...</span></div>}

      {task.id === currentClickTask && <div className="w-full h-full bg-transparent border-2 border-blue-500 absolute top-0 left-0 rounded-md z-10 pointer-events-none"></div>}

      {/* カード（概要） */}
      <div
        onClick={handleSingleClick}
        onDoubleClick={handleDoubleClick}
        id={task.id}
        className={`${personalBg} w-full rounded-sm p-3 pl-4 text-white tracking-wide cursor-pointer relative`}
        {...props}
      >
        {unreadIds && unreadIds.includes(task.id) && (<div className="absolute top-3 left-1.75 w-0.75 h-39.5 bg-[#ffff00] rounded-full" />)}
        <div className="flex items-center gap-1 text-sm leading-6 pb-1.5">
          <HighlightText text={task.serial} keyword={filters.searchKeywords} />
          {user.important_task_id && user.important_task_id.includes(task.id) && (
            <RiFlag2Fill className="text-red-500/80 text-lg" />
          )}
          {currentDeadline && (
            <>
              <MdAlarm className="text-yellow-300 text-lg -ml-0.5 mt-0.5" data-tooltip-id="deadline" data-tooltip-content={`期日が${currentDeadline.date.split("-")[1]}月${currentDeadline.date.split("-")[2]}日に設定されています。`} />
              <Tooltip id="deadline" place="top-end" variant="warning" style={{ color: "#333", fontWeight: "bold", fontSize: "14px", zIndex: 50 }} />
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
          <HighlightText text={task.title} keyword={filters.searchKeywords} />
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
          <HighlightText text={task.description} keyword={filters.searchKeywords} />
        </div>

        {/* <div className="grid gap-2 text-sm grid-cols-6
        group-[.cardListStyle]:mb-2
        group-[.rowListStyle]:[grid-area:cli-mana] group-[.rowListStyle]:gap-1">
          <div className="col-span-4 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><FaRegBuilding />{task.client} 《<HighlightText text={task.requester} keyword={filters.searchKeywords} />》</div>
          <div className="col-span-2 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><BsPersonCheck />{task.manager ? task.manager : "-"}</div>
        </div> */}

        <div className="p-2 rounded-md overflow-hidden relative before:bg-white/40 before:mix-blend-overlay before:w-full before:h-full before:absolute before:top-0 before:left-0">
          <div className="grid gap-2 text-sm grid-cols-6">
            <div className="col-span-2 flex gap-1 items-center"><FaRegBuilding />{clientList[task.client]} 【<HighlightText text={task.requester} keyword={filters.searchKeywords} />】</div>
            <div className="col-span-2 flex gap-1 items-center"><RiCalendarScheduleLine />{task.request_date}</div>
            <div className="col-span-2 flex gap-1 items-center"><FaRegCheckCircle />{task.finish_date ? task.finish_date : "-"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
