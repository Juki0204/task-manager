import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { BsPersonCheck } from "react-icons/bs";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/utils/types/task";
import { useDraggable } from "@dnd-kit/core";
import { useTaskPresence } from "@/utils/hooks/useTaskPresence";
import { User } from "@/utils/types/user";
import { supabase } from "@/utils/supabase/supabase";
import { toast } from "sonner";
import HighlightText from "./ui/HighlightText";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";

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
  ...props
}: CardPropd) {
  const editingUser = useTaskPresence(task.id, { id: user.id, name: user.name }, false); //タスクステータスの監視
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { task, initStatus: task.status, data }, disabled: !isDraggable });
  const { filters } = useTaskListPreferences();

  const draggableStyle = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [personalBorder, setPersonalBorder] = useState<string>('');
  const [personalBg, setPersonalBg] = useState<string>('');

  //担当者別色設定
  function definePersonalColor(manager: string) {
    if (manager === '谷') {
      setPersonalBorder('taniBorder');
      setPersonalBg('taniBg');
    } else if (manager === '飯塚') {
      setPersonalBorder('iiBorder');
      setPersonalBg('iiBg');
    } else if (manager === '浜口') {
      setPersonalBorder('hamaBorder');
      setPersonalBg('hamaBg');
    } else if (manager === '田口') {
      setPersonalBorder('taguBorder');
      setPersonalBg('taguBg');
    } else if (manager === '鎌倉') {
      setPersonalBorder('kamaBorder');
      setPersonalBg('kamaBg');
    } else if (manager === '西谷') {
      setPersonalBorder('nishiBorder');
      setPersonalBg('nishiBg');
    } else {
      setPersonalBorder('defaultBorder');
      setPersonalBg('defaultBg');
    }
  }

  //優先度別色設定
  function definePriorityStyle(priority: string | null) {
    if (priority === '急') {
      setPriorityStyle('bg-red-300 text-red-800');
    } else if (priority === '高') {
      setPriorityStyle('bg-orange-300 text-orange-800');
    } else if (priority === '低') {
      setPriorityStyle('bg-emerald-300 text-emerald-800');
    }
  }

  //作業状況別色設定
  function defineStatusStyle(status: string) {
    if (status === '未着手') {
      setStatusStyle('bg-neutral-300 text-neutral-800');
    } else if (status === '作業中') {
      setStatusStyle('bg-blue-300 text-blue-800');
    } else if (status === '作業途中') {
      setStatusStyle('bg-blue-200 text-blue-800');
    } else if (status === '確認中') {
      setStatusStyle('bg-pink-300 text-pink-800');
    } else if (status === '完了') {
      setStatusStyle('bg-green-300 text-green-800');
    } else if (status === '保留') {
      setStatusStyle('bg-yellow-300 text-yellow-800');
    } else if (status === '中止') {
      setStatusStyle('bg-neutral-600 text-neutral-200');
    } else if (status === '詳細待ち') {
      setStatusStyle('bg-neutral-500 text-neutral-200');
    }
  }

  useEffect(() => {
    definePriorityStyle(task.priority);
    defineStatusStyle(task.status);
    definePersonalColor(task.manager ? task.manager : "");
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
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={draggableStyle}
      onContextMenu={(e) => onContextMenu(e, task.id, task.serial)}
      className={`${task.locked_by_id ? "rolling-border after:rounded-md before:rounded-md" : `static-border ${personalBorder}`} ${task.status === "作業中" ? "inprogress" : ""} rounded-md min-w-90 drop-shadow-md drop-shadow-gray-950/30 ${isDragging ? "!z-50" : ""}`}>

      {task.locked_by_id && <div className="editing-overlay"><span className="editing-overlay-text">{task.locked_by_name}さんが編集中...</span></div>}

      {task.id === currentClickTask && <div className="w-full h-full bg-transparent border-2 border-blue-500 absolute top-0 left-0 rounded-md z-10 pointer-events-none"></div>}

      {/* カード（概要） */}
      <div
        onClick={handleSingleClick}
        onDoubleClick={handleDoubleClick}
        id={task.id}
        className={`${personalBg} w-full rounded-sm p-4 pl-5 text-white tracking-wide cursor-pointer relative hover:brightness-125`}
        {...props}
      >
        {unreadIds && unreadIds.includes(task.id) && (<div className="absolute top-3 left-1.75 w-0.75 h-39.5 bg-[#ffff00] rounded-full" />)}
        <div className="text-xs pb-2">
          <HighlightText text={task.serial} keyword={filters.searchKeywords} />
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

        <div className="w-fit flex gap-1 items-center pl-1 absolute top-4 right-4">
          {
            task.priority ?
              <span className={`py-1 px-2 h-fit rounded-sm text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
              :
              <span className="w-7 h-6 opacity-0"></span>
          }
          <span className={`py-1 px-2 h-fit rounded-sm text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
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

        <div className="grid gap-2 text-sm grid-cols-6
        group-[.rowListStyle]:[grid-area:date]">
          <div className="col-span-3 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><RiCalendarScheduleLine />{task.request_date}</div>
          <div className="col-span-3 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><FaRegCheckCircle />{task.finish_date ? task.finish_date : "-"}</div>
        </div>
      </div>
    </div>
  )
}