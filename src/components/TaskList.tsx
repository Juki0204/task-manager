import Card from "./Card"

import { Task } from "@/utils/types/task"

interface TaskListProps {
  taskList: Task[];
  user: {
    id: string;
    name: string;
    email: string;
    employee: string;
  };
  onClick: (t: Task) => void;
}

export default function TaskList({ taskList, user, onClick }: TaskListProps) {

  return (
    <div className="py-4 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500
      group-[.cardListStyle]:grid group-[.cardListStyle]:grid-cols-1 group-[.cardListStyle]:gap-1 group-[.cardListStyle]:sm:gap-2 group-[.cardListStyle]:md:grid-cols-2 group-[.cardListStyle]:lg:grid-cols-3 group-[.cardListStyle]:2xl:grid-cols-4
      group-[.rowListStyle]:flex group-[.rowListStyle]:gap-0.5 group-[.rowListStyle]:flex-col group-[.rowListStyle]:overflow-x-auto">
      {taskList.map(task => (
        <Card user={user} key={task.id} task={task} onClick={onClick}></Card>
      ))}
    </div>
  )
}