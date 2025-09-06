import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { BsPerson } from "react-icons/bs";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline } from "react-icons/md";
import { FiPhone } from "react-icons/fi";

import { useEffect, useState } from "react";

interface task {
  task: {
    id: string;
    client: string;
    requester: string;
    title: string;
    description: string;
    requireDate: string;
    finishDate?: string;
    manager?: string;
    status: string;
    priority?: string;
    remarks?: string;
    method: string;
  }
}

export default function Card({ task, ...props }: task) {
  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

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
    defineStatusStyle(task.status)
  }, [task]);

  return (
    <div id={task.id} className="min-w-[400px] rounded-xl border-2 border-neutral-600 bg-neutral-800 p-4 text-white tracking-wide" {...props}>
      <div className="flex mb-1 justify-between">
        <h3 className="font-bold text-lg truncate flex items-center gap-1">
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
        <div className="w-fit flex gap-1 items-center pl-1">
          {
            task.priority ?
              <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
              :
              <></>
          }
          <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
        </div>
      </div>
      <div className="line-clamp-2 w-full h-12 mb-3">
        {task.description}
      </div>
      <div className="grid gap-2 grid-cols-6">
        <div className="col-span-4 flex gap-1 items-center border-b border-neutral-600"><FaRegBuilding />{task.client} 《{task.requester}》</div>
        <div className="col-span-2 flex gap-1 items-center border-b border-neutral-600"><BsPerson />{task.manager ? task.manager : "-"}</div>
        <div className="col-span-3 flex gap-1 items-center border-b border-neutral-600"><RiCalendarScheduleLine />{task.requireDate}</div>
        <div className="col-span-3 flex gap-1 items-center border-b border-neutral-600"><FaRegCheckCircle />{task.finishDate ? task.finishDate : "-"}</div>
      </div>
    </div>
  )
}