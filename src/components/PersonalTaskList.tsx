import { supabase } from "@/utils/supabase/supabase"
import Card from "./Card"
import { useEffect, useState } from "react"
import { useAuth } from "@/app/AuthProvider";
import { toast } from "sonner";

import { Task } from "@/utils/types/task";
import { mapDbTaskToTask, dbTaskProps } from "@/utils/function/mapDbTaskToTask";


interface PersonalTaskListProps {
  taskList: Task[];
  onClick: (t: Task) => void;
}

export default function PersonalTaskList({ taskList, onClick }: PersonalTaskListProps) {
  const { user, loading } = useAuth();

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