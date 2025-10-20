import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { BsPersonCheck } from "react-icons/bs";
import { IoFlag } from "react-icons/io5";

import { useEffect, useState } from "react";
import { Task } from "@/utils/types/task";
import { useTaskPresence } from "@/utils/hooks/useTaskPresence";
import HighlightText from "./ui/HighlightText";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { User } from "@/utils/types/user";
import { supabase } from "@/utils/supabase/supabase";

interface CardPropd {
  task: Task;
  user: User;
  unreadIds?: string[];
  importantIds?: string[];
  handleImportantTask?: (taskId: string) => Promise<void>;
  onClick: (task: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
}

export default function Card({ task, user, unreadIds, importantIds, handleImportantTask, onClick, onContextMenu, ...props }: CardPropd) {
  const editingUser = useTaskPresence(task.id, { id: user.id, name: user.name }, false);
  const { filters } = useTaskListPreferences();

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [personalBorder, setPersonalBorder] = useState<string>('');
  const [personalBg, setPersonalBg] = useState<string>('');

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

  function definePriorityStyle(priority: string | undefined) {
    if (priority === '急') {
      setPriorityStyle('bg-red-300 text-red-800');
    } else if (priority === '高') {
      setPriorityStyle('bg-orange-300 text-orange-800');
    } else if (priority === '低') {
      setPriorityStyle('bg-emerald-300 text-emerald-800');
    }
  }

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

  return (
    <div
      onContextMenu={(e) => onContextMenu(e, task.id, task.serial)}
      className={`${task.lockedById ? "rolling-border" : `static-border ${personalBorder}`} ${task.status === "作業中" ? "inprogress" : ""} group-[.cardListStyle]:rounded-md min-w-90 group-[.rowListStyle]:w-[1568px]`}>
      {task.lockedById && <div className="editing-overlay"><span className="editing-overlay-text">{task.lockedByName}さんが編集中...</span></div>}
      {/* カード（概要） */}
      <div
        onClick={() => onClick(task)}
        id={task.id}
        className={`${personalBg} w-full p-4 text-white tracking-wide cursor-pointer relative group-[.cardListStyle]:rounded-sm group-[.cardListStyle]:h-full
        group-[.rowListStyle]:grid group-[.rowListStyle]:[grid-template-areas:'id_ttl_dis_cli-mana_status_date'] group-[.rowListStyle]:items-center group-[.rowListStyle]:grid-cols-[100px_240px_500px_340px_120px_auto]  group-[.rowListStyle]:py-2`}
        {...props}
      >
        {unreadIds && unreadIds.includes(task.id) && (
          <div className="absolute group-[.cardListStyle]:top-1 group-[.cardListStyle]:w-0.75 group-[.cardListStyle]:rounded-full group-[.cardListStyle]:h-44 left-2 w-1 h-8 bg-[#ffff00]" />
        )}
        <div className="text-xs group-[.cardListStyle]:pb-2 flex items-center gap-1">
          {handleImportantTask && (
            <div onClick={(e) => {
              e.stopPropagation();
              handleImportantTask(task.id);
            }}>
              <IoFlag className={`text-lg -ml-0.5 ${importantIds?.includes(task.id) ? "text-red-500" : "opacity-10 grayscale-100"}`} />
            </div>
          )}
          {task.serial}
        </div>
        <h3 className="font-bold flex items-center gap-1
          group-[.rowListStyle]:[grid-area:ttl]
          group-[.rowListStyle]:text-sm">
          {
            task.method === 'mail' ?
              <MdMailOutline />
              : task.method === 'tel' ?
                <FiPhone />
                :
                <FaRegQuestionCircle />
          }
          <span className="truncate flex-1">
            <HighlightText text={task.title} keyword={filters.searchKeywords} />
          </span>
        </h3>

        <div className="w-fit flex gap-1 items-center pl-1
          group-[.cardListStyle]:absolute group-[.cardListStyle]:top-4 group-[.cardListStyle]:right-4
          group-[.rowListStyle]:[grid-area:status] group-[.rowListStyle]:pl-3">
          {
            task.priority ?
              <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
              :
              <span className="w-7 h-6 opacity-0"></span>
          }
          <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
        </div>

        <div className="line-clamp-2 w-full text-sm
        group-[.cardListStyle]:h-10 group-[.cardListStyle]:mb-3
        group-[.rowListStyle]:[grid-area:dis]">
          <HighlightText text={task.description} keyword={filters.searchKeywords} />
        </div>

        <div className="grid gap-2 text-sm grid-cols-6
        group-[.cardListStyle]:mb-2
        group-[.rowListStyle]:[grid-area:cli-mana] group-[.rowListStyle]:gap-1">
          <div className="col-span-4 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><FaRegBuilding />{task.client} 《<HighlightText text={task.requester} keyword={filters.searchKeywords} />》</div>
          <div className="col-span-2 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><BsPersonCheck />{task.manager ? task.manager : "-"}</div>
        </div>

        <div className="grid gap-2 text-sm grid-cols-6
        group-[.rowListStyle]:[grid-area:date]">
          <div className="col-span-3 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><RiCalendarScheduleLine />{task.requestDate}</div>
          <div className="col-span-3 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><FaRegCheckCircle />{task.finishDate ? task.finishDate : "-"}</div>
        </div>
      </div>
    </div>
  )
}