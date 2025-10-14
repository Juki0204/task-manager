import { Task } from "@/utils/types/task";
import { TaskColumn } from "./ui/TaslColumn";

interface PersonalTaskListProps {
  taskList: Task[];
  user: {
    id: string;
    name: string;
    email: string;
    employee: string;
  };
  sortTask: (taskList: Task[]) => Task[];
  onClick: (t: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
}

export default function PersonalTaskList({ taskList, user, sortTask, onClick, onContextMenu }: PersonalTaskListProps) {
  return (
    <div className="pb-4 grid grid-cols-4 gap-4 w-[1568px]">
      <TaskColumn
        id="NotYetStarted"
        title="未担当タスク"
        tasks={taskList.filter((task) => !task.manager)}
        user={user}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className="bg-zinc-700 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]"
      />

      <TaskColumn
        id="InProgress"
        title="自分のタスク（未着手・作業中）"
        tasks={sortTask(taskList).filter((task) => task.manager === user.name && task.status !== '確認中' && task.status !== '完了')}
        user={user}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className="bg-gray-700 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]"
      />

      <TaskColumn
        id="Confirm"
        title="自分のタスク（確認中）"
        tasks={taskList.filter((task) => task.manager === user.name && task.status === '確認中')}
        user={user}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className="bg-slate-700 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]"
      />

      <TaskColumn
        id="Completed"
        title="今週の完了タスク"
        tasks={taskList.filter((task) => {
          if (task.manager !== user.name || task.status !== '完了') return false;
          if (!task.finishDate) return false;

          // finishDateを常にローカル日付として解釈
          const finish = new Date(`${task.finishDate}T00:00:00`);
          const today = new Date();

          // 今日の0時時点から7日前の0時までを計算
          const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();
          const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).getTime();

          return finish.getTime() >= weekAgo && finish.getTime() < endOfToday;
        }).sort((a, b) => {
          const finishA = a.finishDate ? new Date(`${a.finishDate}`).getTime() : 0;
          const finishB = b.finishDate ? new Date(`${b.finishDate}`).getTime() : 0;

          //完了日順ソート
          return finishA - finishB;
        })}
        user={user}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className="bg-slate-600 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]"
      />

    </div>
  )
}