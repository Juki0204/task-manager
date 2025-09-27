import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { BsPersonCheck } from "react-icons/bs";

import { useEffect, useState } from "react";
import { Task } from "@/utils/types/task";
import { useTaskPresence } from "@/utils/hooks/useTaskPresence";

interface CardPropd {
  task: Task;
  user: {
    id: string;
    name: string;
    email: string;
    employee: string;
  },
  onClick: (task: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
}

export default function Card({ task, user, onClick, onContextMenu, ...props }: CardPropd) {
  const editingUser = useTaskPresence(task.id, { id: user.id, name: user.name }, false);

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [personalBorder, setPersonalBorder] = useState<string>('');
  const [personalBg, setPersonalBg] = useState<string>('');

  function definePersonalColor(manager: string) {
    if (manager === '谷') {
      setPersonalBorder('bg-pink-800');
      setPersonalBg('bg-pink-800/25');
    } else if (manager === '飯塚') {
      setPersonalBorder('bg-green-800');
      setPersonalBg('bg-green-800/25');
    } else if (manager === '浜口') {
      setPersonalBorder('bg-orange-800');
      setPersonalBg('bg-orange-800/25');
    } else if (manager === '田口') {
      setPersonalBorder('bg-red-800');
      setPersonalBg('bg-red-800/25');
    } else if (manager === '鎌倉') {
      setPersonalBorder('bg-sky-800');
      setPersonalBg('bg-sky-800/25');
    } else if (manager === '西谷') {
      setPersonalBorder('bg-indigo-800');
      setPersonalBg('bg-indigo-800/25');
    } else {
      setPersonalBorder('bg-neutral-600');
      setPersonalBg('bg-neutral-800/25');
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
    <div onContextMenu={(e) => onContextMenu(e, task.id, task.serial)} className={`${task.lockedById ? "rolling-border" : `static-border ${personalBorder}`} rounded-xl min-w-90
      group-[.rowListStyle]:w-[1568px]`}>
      {task.lockedById && <div className="editing-overlay"><span className="editing-overlay-text">{task.lockedByName}さんが編集中...</span></div>}
      {/* カード（概要） */}
      <div
        onClick={() => onClick(task)}
        id={task.id}
        className={`${personalBg} w-full rounded-xl p-4 text-white tracking-wide cursor-pointer relative
        group-[.rowListStyle]:grid group-[.rowListStyle]:[grid-template-areas:'id_ttl_dis_cli-mana_status_date'] group-[.rowListStyle]:items-center group-[.rowListStyle]:grid-cols-[80px_240px_500px_330px_120px_auto]  group-[.rowListStyle]:py-2`}
        {...props}
      >
        <div className="text-xs">{task.serial}</div>
        <h3 className="font-bold truncate flex items-center gap-1
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
          {task.title}
        </h3>

        <div className="w-fit flex gap-1 items-center pl-1
          group-[.cardListStyle]:absolute group-[.cardListStyle]:top-4 group-[.cardListStyle]:right-4
          group-[.rowListStyle]:[grid-area:status]">
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
          {task.description}
        </div>

        <div className="grid gap-2 text-sm grid-cols-6
        group-[.cardListStyle]:mb-2
        group-[.rowListStyle]:[grid-area:cli-mana]">
          <div className="col-span-4 flex gap-1 items-center group-[.cardListStyle]:border-b border-neutral-600"><FaRegBuilding />{task.client} 《{task.requester}》</div>
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