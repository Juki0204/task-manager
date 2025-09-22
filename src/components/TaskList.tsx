import { supabase } from "@/utils/supabase/supabase"
import Card from "./Card"
import { useEffect, useState } from "react"

import { Task } from "@/utils/types/task"
import { mapDbTaskToTask } from "@/utils/function/mapDbTaskToTask";

export default function TaskList({ onClick }: { onClick: (t: Task) => void }) {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const getTasks = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')

    if (tasks) {
      // console.log(tasks);
      const taskData: Task[] = [];
      tasks.forEach(task => {
        const currentTaskData = mapDbTaskToTask(task);
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
        <Card key={task.id} task={task} onClick={onClick}></Card>
      ))}
    </div>
  )
}