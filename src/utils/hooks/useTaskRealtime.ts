import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import { Task } from "../types/task";
import { dbTaskProps, mapDbTaskToTask } from "../function/mapDbTaskToTask";
import { toast } from "sonner";

type UserData = {
  id: string;
  name: string;
  email: string;
  employee: string;
} | null;

export function useTaskRealtime(user: UserData) {
  const [taskList, setTaskList] = useState<Task[]>([]);

  const getTasks = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .not("status", "in", "(完了,削除済)") //完了項目以外

    if (tasks) {
      // console.log(tasks);
      const taskData: Task[] = tasks.map(task => mapDbTaskToTask(task));
      taskData.sort((a, b) => {
        const dataA = new Date(a.requestDate).getTime();
        const dataB = new Date(b.requestDate).getTime();
        return dataA - dataB;
      });

      setTaskList(taskData);
    }
  }

  useEffect(() => {
    if (!user) return;

    getTasks();

    const channel = supabase
      .channel(`task-changes-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          // console.log('realtime:', payload);

          if (payload.eventType === "INSERT") {
            toast.success(`${user.name}さんが新しいタスクを追加しました。`);
            setTaskList((prev) => [...prev, mapDbTaskToTask(payload.new as dbTaskProps)]);
          }

          if (payload.eventType === "UPDATE") {
            // toast.info('タスクが更新されました。');
            if (payload.new.status === "削除済" || payload.new.status === "完了") {
              setTaskList((prev) => prev.filter((t) => t.id !== payload.new.id));
            } else {
              setTaskList((prev) =>
                prev.map((t) =>
                  t.id === payload.new.id ? mapDbTaskToTask(payload.new as dbTaskProps) : t
                )
              );
            }
          }

          if (payload.eventType === "DELETE") {
            toast.error('タスクが削除されました。');
            setTaskList((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        console.log("タブ復帰 → 再購読しました");
        getTasks();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  return taskList;
}