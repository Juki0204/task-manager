import { FaRegBuilding, FaRegCheckCircle } from "react-icons/fa";
import { BsPerson } from "react-icons/bs";
import { RiCalendarScheduleLine } from "react-icons/ri";

interface task {
  task: {
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
  }
}

export default function Card({ task, ...props }: task) {
  return (
    <div className="w-1/2 rounded-xl border-2 border-neutral-600 bg-neutral-800 p-4 text-white tracking-wide" {...props}>
      <div className="flex mb-1 justify-between">
        <h3 className="font-bold text-lg truncate">{task.title}</h3>
        <div className="w-fit flex gap-1 items-center pl-1">
          {
            task.priority ?
              <span className="py-1 px-2 h-fit rounded-md text-xs font-bold bg-red-300 text-red-800 whitespace-nowrap">{task.priority}</span>
              :
              <></>
          }
          <span className="py-1 px-2 h-fit rounded-md text-xs font-bold bg-sky-300 text-sky-800 whitespace-nowrap">{task.status}</span>
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