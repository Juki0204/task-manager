import { User } from "@/utils/types/user";
import Card from "./Card"

import { Task } from "@/utils/types/task"

interface TaskListProps {
  taskList: Task[];
  user: User;
  unreadIds?: string[];
  importantIds?: string[];
  handleImportantTask?: (taskId: string) => Promise<void>;
  onClick: (t: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
}

export default function TaskList({ taskList, user, unreadIds, importantIds, handleImportantTask, onClick, onContextMenu }: TaskListProps) {

  return (
    <div className="pb-4 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500
      group-[.cardListStyle]:grid group-[.cardListStyle]:grid-cols-1 group-[.cardListStyle]:gap-1 group-[.cardListStyle]:sm:gap-2 group-[.cardListStyle]:md:grid-cols-2 group-[.cardListStyle]:lg:grid-cols-3 group-[.cardListStyle]:2xl:grid-cols-4
      group-[.rowListStyle]:flex group-[.rowListStyle]:gap-0.5 group-[.rowListStyle]:flex-col group-[.rowListStyle]:overflow-x-auto">
      {taskList.map(task => (
        <Card user={user} key={task.id} task={task} unreadIds={unreadIds} importantIds={importantIds} handleImportantTask={handleImportantTask} onClick={onClick} onContextMenu={onContextMenu} />
      ))}
    </div>
  )
}