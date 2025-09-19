import { supabase } from "@/utils/supabase/supabase"
import Card from "./Card"
import { useEffect, useState } from "react"

interface task {
  id: string;
  client: string;
  requester: string;
  title: string;
  description: string;
  requireDate: string;
  finishDate: string | "";
  manager: string | "";
  status: string;
  priority: string | "";
  remarks: string | "";
  method: string;
  createdAt: string;
  createdManager: string;
  updatedAt: string;
  updatedManager: string;
  serial: string;
}

export default function TaskList() {
  const [taskList, setTaskList] = useState<task[]>([]);
  const getTasks = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')

    if (tasks) {
      // console.log(tasks);
      const taskData: task[] = [];
      tasks.forEach(task => {
        const currentTaskData = {
          id: task.id,
          client: task.client,
          requester: task.requester,
          title: task.title,
          description: task.description,
          requireDate: task.request_date,
          finishDate: task.finish_date,
          manager: task.manager,
          status: task.status,
          priority: task.priority,
          remarks: task.remarks,
          method: task.method,
          createdAt: task.created_at,
          createdManager: task.created_manager,
          updatedAt: task.updated_at,
          updatedManager: task.updated_manager,
          serial: task.serial,
        }
        taskData.push(currentTaskData);
      });
      setTaskList(taskData);
      // console.log(taskData);
    }
  }

  useEffect(() => {
    getTasks();
  }, []);

  return (
    <div className="py-4 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500
      group-[.cardListStyle]:grid group-[.cardListStyle]:grid-cols-1 group-[.cardListStyle]:gap-1 group-[.cardListStyle]:sm:gap-2 group-[.cardListStyle]:md:grid-cols-2 group-[.cardListStyle]:lg:grid-cols-3 group-[.cardListStyle]:2xl:grid-cols-4
      group-[.rowListStyle]:flex group-[.rowListStyle]:gap-0.5 group-[.rowListStyle]:flex-col group-[.rowListStyle]:overflow-x-auto">
      {taskList.map(task => (
        <Card key={task.id} task={task}></Card>
      ))}
    </div>
  )
}