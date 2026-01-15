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

interface deadline {
  task_id: string;
  date: string;
}

export function useTaskRealtime(user: UserData) {
  console.log("useTaskRealtime init");

  const [taskList, setTaskList] = useState<Task[]>([]);
  const [deadlineList, setDeadlineList] = useState<{ task_id: string, date: string }[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);
  const getTasks = async () => {

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const y = oneWeekAgo.getFullYear();
    const m = String(oneWeekAgo.getMonth() + 1).padStart(2, "0");
    const d = String(oneWeekAgo.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`; // "YYYY-MM-DD"

    // 進行中タスク
    const { data: activeTasks } = await supabase
      .from("tasks")
      .select("*")
      .neq("status", "完了")
      .neq("status", "削除済");

    // 直近1週間の完了タスク
    const { data: recentCompleted } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "完了")
      .gte("finish_date", dateStr);

    const tasks = [...(activeTasks ?? []), ...(recentCompleted ?? [])];

    if (tasks) {
      tasks.sort((a, b) => {
        const dataA = new Date(a.request_date).getTime();
        const dataB = new Date(b.request_date).getTime();
        return dataA - dataB;
      });

      setTaskList(tasks);
    }

    const { data: deadline } = await supabase
      .from("deadline")
      .select("*");

    if (!deadline) return;
    setDeadlineList(deadline);
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
    if (!user?.id) return;

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
            setTaskList((prev) => [...prev, payload.new as Task]);
            setTimeout(() => {
              toast.success(`${payload.new.created_manager}さんがタスク【${payload.new.serial}】を追加しました。`);
            }, 500);
          }

          if (payload.eventType === "UPDATE") {
            setTaskList((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? payload.new as Task : t
              )
            );

            // if (payload.old.status !== "削除済" && payload.new.status === "削除済") { //削除されたとき
            //   toast.success(`${payload.new.changed_by}さんがタスク【${payload.new.serial}】を削除しました。`);
            // }

            // if (payload.new) {
            //   toast.success(`${payload.new.created_manager}さんがタスク【${payload.new.serial}】を更新しました。`);
            // }
          }

          if (payload.eventType === "DELETE") {
            // toast.error('タスクが削除されました。');
            setTaskList((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    //deadline の realtime
    const deadlineChannel = supabase
      .channel("deadline-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "deadline" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setDeadlineList((prev) => [...prev, payload.new as deadline]);
        }

        if (payload.eventType === "UPDATE") {
          setDeadlineList((prev) =>
            prev.map((d) => (d.task_id === (payload.new as deadline).task_id ? (payload.new as deadline) : d))
          );
        }

        if (payload.eventType === "DELETE") {
          setDeadlineList((prev) => prev.filter((d) => d.task_id !== (payload.old as deadline).task_id));
        }
      })
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        console.log("タブ復帰 → 再同期しました");
        getTasks();
        toast.success(`タスクの同期が完了しました。`);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
      deadlineChannel.unsubscribe();
      supabase.removeChannel(deadlineChannel);
    };
  }, [user?.id]);



  const updateTaskStatus = async (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => {
    //即時UI更新
    setTaskList((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, ...extraFields } : t
      )
    );

    //DB更新
    if (newStatus === "確認中") {
      const { error: finishError } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          finish_date: new Date().toLocaleDateString("sv-SE"),
          ...extraFields
        })
        .eq("id", taskId);

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

  return { taskList, updateTaskStatus, sortTask, deadlineList, isReady };
}