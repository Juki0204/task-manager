import { supabase } from "@/utils/supabase/supabase"
import Card from "./Card"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/app/function/getCurrentUser";

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

type user = {
  id: string;
  name: string;
  email: string;
  employee: string;
} | undefined

export default function PersonalTaskList() {
  const [currentUser, setCurrentUser] = useState<user>();
  const [taskList, setTaskList] = useState<task[]>([]);

  const getUser = async () => {
    const user = await getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }

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
    getUser();
    getTasks();
  }, []);

  return (
    <div className="py-4 grid grid-cols-4 gap-4">
      <div className="bg-zinc-700 p-2 rounded-xl flex flex-col gap-1">
        <h2 className="font-bold text-white pl-1">未担当タスク</h2>

        {taskList.filter((task) => !task.manager).map(task => (
          <Card key={task.id} task={task}></Card>
        ))}
      </div>

      <div className="bg-gray-700 p-2 rounded-xl flex flex-col gap-1">
        <h2 className="font-bold text-white pl-1">自分のタスク（未着手・作業中）</h2>

        {currentUser ?
          <>
            {taskList.filter((task) => task.manager === currentUser.name && task.status !== '確認中' && task.status !== '完了').map(task => (
              <Card key={task.id} task={task}></Card>
            ))}
          </>
          :
          <p>タスクがありません</p>
        }
      </div>

      <div className="bg-slate-700 p-2 rounded-xl flex flex-col gap-1">
        <h2 className="font-bold text-white pl-1">自分のタスク（確認中）</h2>

        {currentUser ?
          <>
            {taskList.filter((task) => task.manager === currentUser.name && task.status === '確認中').map(task => (
              <Card key={task.id} task={task}></Card>
            ))}
          </>
          :
          <p>タスクがありません</p>
        }
      </div>

      <div className="bg-slate-600 p-2 rounded-xl flex flex-col gap-1">
        <h2 className="font-bold text-white pl-1">本日の完了タスク</h2>

        {currentUser ?
          <>
            {taskList.filter((task) => task.manager === currentUser.name && task.status === '完了' && new Date(task.finishDate).getDate() <= new Date().getDate()).map(task => (
              <Card key={task.id} task={task}></Card>
            ))}
          </>
          :
          <p>タスクがありません</p>
        }
      </div>

    </div>
  )
}