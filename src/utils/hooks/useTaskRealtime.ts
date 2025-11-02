import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import { Task } from "../types/task";
import { toast } from "sonner";
import { compareHistory } from "../function/comparHistory";
import { generateChangeMessage } from "../function/generateChangeMessage";

type UserData = {
  id: string;
  name: string;
  email: string;
  employee: string;
} | null;

export function useTaskRealtime(user: UserData) {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  const getTasks = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')

    if (tasks) {
      // console.log(tasks);
      tasks.sort((a, b) => {
        const dataA = new Date(a.request_date).getTime();
        const dataB = new Date(b.request_date).getTime();
        return dataA - dataB;
      });

      setTaskList(tasks);
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

      const dateA = new Date(a.request_date).getTime();
      const dateB = new Date(b.request_date).getTime();
      return dateA - dateB;
    });
    return sortTaskData;
  };


  useEffect(() => {
    if (!user) return;

    setIsReady(true);
    getTasks();

    const channel = supabase
      .channel("task-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        async (payload) => {
          // console.log('realtime:', payload);

          if (payload.eventType === "INSERT") {
            // toast.success(`新しいタスクが追加されました。`);
            setTaskList((prev) => [...prev, payload.new as Task]);
          }

          if (payload.eventType === "UPDATE") {
            // toast.info('タスクが更新されました。');

            setTaskList((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? payload.new as Task : t
              )
            );
          }

          if (payload.eventType === "DELETE") {
            // toast.error('タスクが削除されました。');
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
      channel.unsubscribe();
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);



  const updateTaskStatus = async (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => {
    //即時UI更新
    setTaskList((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, ...extraFields } : t
      )
    );

    //DB更新
    if (newStatus === "完了" || newStatus === "確認中") {
      const { error: finishError } = await supabase.from("tasks").update({ status: newStatus, finish_date: new Date().toLocaleDateString("sv-SE"), ...extraFields }).eq("id", taskId);

      if (finishError) {
        console.error(finishError);
        // 失敗時は巻き戻す
        setTaskList((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: prevStatus } : t
          )
        );
      }
    } else {
      const { error: updateError } = await supabase.from("tasks").update({ status: newStatus, ...extraFields }).eq("id", taskId);

      if (updateError) {
        console.error(updateError);
        // 失敗時は巻き戻す
        setTaskList((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: prevStatus } : t
          )
        );
      }
    }
  };

  return { taskList, updateTaskStatus, sortTask, isReady };
}