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


  const statusPriority: Record<string, number> = {
    "作業中": 3,
    "作業途中": 2,
  };

  const sortTask = (taskList: Task[]) => {
    const sortTaskData = [...taskList]; // コピーを作る
    sortTaskData.sort((a, b) => {
      const priA = statusPriority[a.status] ?? 1;
      const priB = statusPriority[b.status] ?? 1;

      if (priA !== priB) return priB - priA;

      const dateA = new Date(a.requestDate).getTime();
      const dateB = new Date(b.requestDate).getTime();
      return dateA - dateB;
    });
    return sortTaskData;
  };


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
            toast.success(`新しいタスクが追加されました。`);
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



  const updateTaskStatus = async (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => {
    //即時UI更新
    setTaskList((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, ...extraFields } : t
      );
      // console.log("UIが更新されました");
      // return sortTask(updated);
      return updated;
    });

    //DB更新
    const { error } = await supabase.from("tasks").update({ status: newStatus, ...extraFields }).eq("id", taskId);

    if (error) {
      console.error(error);
      // 失敗時は巻き戻す
      setTaskList((prev) =>
        // sortTask(
        prev.map((t) =>
          t.id === taskId ? { ...t, status: prevStatus } : t
          // )
        )
      );
    } else {
      console.log("タスクの更新が完了しました。");
    }
  };

  return { taskList, updateTaskStatus, sortTask };
}