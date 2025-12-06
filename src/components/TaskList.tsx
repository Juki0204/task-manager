import { User } from "@/utils/types/user";
import Card from "./Card"

import { Task } from "@/utils/types/task"

interface TaskListProps {
  taskList: Task[];
  user: User;
  unreadIds?: string[];
  onClick: (t: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
  onEdit: (t: Task) => void;
}

export default function TaskList({ taskList, user, unreadIds, onClick, onContextMenu, onEdit }: TaskListProps) {

  return (
    <div className="pb-4 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500
      flex gap-0.5 flex-col overflow-x-auto">
      {taskList.map(task => (
        <Card
          user={user}
          key={task.id}
          task={task}
          unreadIds={unreadIds}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}