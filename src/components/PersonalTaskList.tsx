import { supabase } from "@/utils/supabase/supabase"
import Card from "./Card"
import { useEffect, useState } from "react"
import { useAuth } from "@/app/AuthProvider";
import { toast } from "sonner";

import { Task } from "@/utils/types/task";

export default function PersonalTaskList({ onClick }: { onClick: (t: Task) => void }) {
  const { user, loading } = useAuth();

  const [taskList, setTaskList] = useState<Task[]>([]);

  const getTasks = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .or(`manager.eq.${user?.name},manager.eq.`) //自分or空

    if (tasks) {
      // console.log(tasks);
      const taskData: Task[] = [];
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

  // useEffect(() => {
  //   getTasks();
  // }, [user]);

  useEffect(() => {
    getTasks();
    const channel = supabase
      .channel('task-changes')
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          console.log('realtime:', payload);

          if (payload.eventType === "INSERT") {
            toast.success('新しいタスクが追加されました。');
          }
          if (payload.eventType === "UPDATE") {
            toast.info('タスクが更新されました。');
          }
          if (payload.eventType === "DELETE") {
            toast.error('タスクが削除されました。');
          }

          setTaskList((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as Task];
            }

            if (payload.eventType === "UPDATE") {
              return prev.map((t) =>
                t.id === (payload.new as Task).id ? (payload.new as Task) : t
              );
            }

            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== (payload.old as Task).id);
            }

            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [user]);

  return (
    <div className="py-4 grid grid-cols-4 gap-4 w-[1568px]">
      <div className="bg-zinc-700 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]">
        <h2 className="font-bold text-white pl-1">未担当タスク</h2>

        {taskList.filter((task) => !task.manager).map(task => (
          <Card key={task.id} task={task} onClick={onClick}></Card>
        ))}
      </div>

      <div className="bg-gray-700 p-2 rounded-xl flex flex-col gap-1 min-h-[calc(100vh-9.5rem)]">
        <h2 className="font-bold text-white pl-1">自分のタスク（未着手・作業中）</h2>

        {user ?
          <>
            {taskList.filter((task) => task.manager === user.name && task.status !== '確認中' && task.status !== '完了').map(task => (
              <Card key={task.id} task={task} onClick={onClick}></Card>
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
              <Card key={task.id} task={task} onClick={onClick}></Card>
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
            {taskList.filter((task) => task.manager === user.name && task.status === '完了' && new Date(task.finishDate ? task.finishDate : "").getDate() <= new Date().getDate() + 7).map(task => (
              <Card key={task.id} task={task} onClick={onClick}></Card>
            ))}
          </>
          :
          <p>読み込み中...</p>
        }
      </div>

    </div>
  )
}