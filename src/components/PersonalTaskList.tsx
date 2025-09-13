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

export default function PersonalTaskList() {
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
    <div className="py-4">
      {taskList.map(task => (
        <Card key={task.id} task={task}></Card>
      ))}
    </div>
  )
}