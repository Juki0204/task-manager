import Card from "./Card"

import { Task } from "@/utils/types/task";


interface PersonalTaskListProps {
  taskList: Task[];
  user: {
    id: string;
    name: string;
    email: string;
    employee: string;
  };
  onClick: (t: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
}

export default function PersonalTaskList({ taskList, user, onClick, onContextMenu }: PersonalTaskListProps) {

  return (
    <div className="py-4 grid grid-cols-4 gap-4 w-[1568px]">
      <div className="bg-zinc-700 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]">
        <h2 className="font-bold text-white pl-1">未担当タスク</h2>

        {taskList.filter((task) => !task.manager).map(task => (
          <Card user={user} key={task.id} task={task} onClick={onClick} onContextMenu={onContextMenu}></Card>
        ))}
      </div>

      <div className="bg-gray-700 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]">
        <h2 className="font-bold text-white pl-1">自分のタスク（未着手・作業中）</h2>

        {user ?
          <>
            {taskList.filter((task) => task.manager === user.name && task.status !== '確認中' && task.status !== '完了').map(task => (
              <Card user={user} key={task.id} task={task} onClick={onClick} onContextMenu={onContextMenu}></Card>
            ))}
          </>
          :
          <p>読み込み中...</p>
        }
      </div>

      <div className="bg-slate-700 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]">
        <h2 className="font-bold text-white pl-1">自分のタスク（確認中）</h2>

        {user ?
          <>
            {taskList.filter((task) => task.manager === user.name && task.status === '確認中').map(task => (
              <Card user={user} key={task.id} task={task} onClick={onClick} onContextMenu={onContextMenu}></Card>
            ))}
          </>
          :
          <p>読み込み中...</p>
        }
      </div>

      <div className="bg-slate-600 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]">
        <h2 className="font-bold text-white pl-1">本日の完了タスク</h2>

        {user ?
          <>
            {taskList.filter((task) => {
              if (task.manager !== user.name || task.status !== '完了') return false;
              if (!task.finishDate) return false;
              const finish = new Date(task.finishDate).getTime();
              const now = Date.now();
              const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
              return finish >= weekAgo && finish <= now; //直近7日以内の完了タスク
            }).map(task => (
              <Card user={user} key={task.id} task={task} onClick={onClick} onContextMenu={onContextMenu}></Card>
            ))}
          </>
          :
          <p>読み込み中...</p>
        }
      </div>

    </div>
  )
}