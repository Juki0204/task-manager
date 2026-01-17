import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabase/supabase";
import { Task } from "../types/task";
import { toast } from "sonner";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type UserData = {
  id: string;
  name: string;
  email: string;
  employee: string;
} | null;

interface DeadlineRow {
  task_id: string;
  date: string;
}

type SubStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR" | "UNKNOWN";

export function useTaskRealtime(user: UserData) {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [deadlineList, setDeadlineList] = useState<DeadlineRow[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  //task購読ステータス（監視対象は task のみ）
  const [taskSubStatus, setTaskSubStatus] = useState<SubStatus>("UNKNOWN");
  const taskSubStatusRef = useRef<SubStatus>("UNKNOWN");

  //channelsをまとめて管理
  const taskChannelRef = useRef<RealtimeChannel | null>(null);
  const deadlineChannelRef = useRef<RealtimeChannel | null>(null);

  //getTasks の多重実行を軽く抑制（任意だけど事故減る）
  const syncingRef = useRef(false);

  const getTasks = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const y = oneWeekAgo.getFullYear();
      const m = String(oneWeekAgo.getMonth() + 1).padStart(2, "0");
      const d = String(oneWeekAgo.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;

      const { data: activeTasks, error: activeErr } = await supabase
        .from("tasks")
        .select("*")
        .neq("status", "完了")
        .neq("status", "削除済");

      if (activeErr) console.error(activeErr);

      const { data: recentCompleted, error: completedErr } = await supabase
        .from("tasks")
        .select("*")
        .eq("status", "完了")
        .gte("finish_date", dateStr);

      if (completedErr) console.error(completedErr);

      const tasks = [...(activeTasks ?? []), ...(recentCompleted ?? [])];

      tasks.sort((a, b) => {
        const dataA = new Date(a.request_date).getTime();
        const dataB = new Date(b.request_date).getTime();
        return dataA - dataB;
      });

      setTaskList(tasks);

      const { data: deadline, error: deadlineErr } = await supabase
        .from("deadline")
        .select("*");

      if (deadlineErr) console.error(deadlineErr);
      if (deadline) setDeadlineList(deadline as DeadlineRow[]);
    } finally {
      setTimeout(() => {
        syncingRef.current = false;
      }, 250);
    }
  }, []);


  const statusPriority: Record<string, number> = useMemo(
    () => ({
      作業中: 3,
      作業途中: 2,
    }),
    []
  );

  const sortTask = useCallback(
    (list: Task[]) => {
      const copied = [...list];
      copied.sort((a, b) => {
        const priA = statusPriority[a.status] ?? 1;
        const priB = statusPriority[b.status] ?? 1;

        if (priA !== priB) return priB - priA;

        const dateA = new Date(a.request_date).getTime();
        const dateB = new Date(b.request_date).getTime();
        return dateA - dateB;
      });
      return copied;
    },
    [statusPriority]
  );

  //realtime handlers（型安全
  const onTaskChange = useCallback((payload: RealtimePostgresChangesPayload<Task>) => {
    if (payload.eventType === "INSERT") {
      const inserted = payload.new;

      setTaskList((prev) => {
        // 念のため二重防止
        if (prev.some((t) => t.id === inserted.id)) return prev;
        return [...prev, inserted];
      });

      setTimeout(() => {
        toast.success(`${inserted.created_manager}さんがタスク【${inserted.serial}】を追加しました。`);
      }, 500);

      return;
    }

    if (payload.eventType === "UPDATE") {
      const updated = payload.new;

      setTaskList((prev) => {
        const exists = prev.some((t) => t.id === updated.id);

        //取りこぼし対策：存在しないなら追加
        if (!exists) return [...prev, updated];

        return prev.map((t) => (t.id === updated.id ? updated : t));
      });

      return;
    }

    if (payload.eventType === "DELETE") {
      const deletedId = payload.old?.id;
      if (!deletedId) return;
      setTaskList((prev) => prev.filter((t) => t.id !== deletedId));
    }
  }, []);

  const onDeadlineChange = useCallback((payload: RealtimePostgresChangesPayload<DeadlineRow>) => {
    if (payload.eventType === "INSERT") {
      const inserted = payload.new;
      setDeadlineList((prev) => {
        if (prev.some((d) => d.task_id === inserted.task_id)) return prev;
        return [...prev, inserted];
      });
      return;
    }

    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      setDeadlineList((prev) => {
        const exists = prev.some((d) => d.task_id === updated.task_id);
        if (!exists) return [...prev, updated];
        return prev.map((d) => (d.task_id === updated.task_id ? updated : d));
      });
      return;
    }

    if (payload.eventType === "DELETE") {
      const deletedId = payload.old?.task_id;
      if (!deletedId) return;
      setDeadlineList((prev) => prev.filter((d) => d.task_id !== deletedId));
    }
  }, []);


  const cleanupAll = useCallback(() => {
    if (taskChannelRef.current) {
      taskChannelRef.current.unsubscribe();
      supabase.removeChannel(taskChannelRef.current);
      taskChannelRef.current = null;
    }
    if (deadlineChannelRef.current) {
      deadlineChannelRef.current.unsubscribe();
      supabase.removeChannel(deadlineChannelRef.current);
      deadlineChannelRef.current = null;
    }
  }, []);

  const subscribeAll = useCallback(() => {
    if (!user?.id) return;

    //二重購読防止
    cleanupAll();

    //task status 初期化
    setTaskSubStatus("UNKNOWN");
    taskSubStatusRef.current = "UNKNOWN";

    //tasks（status監視対象）
    taskChannelRef.current = supabase
      .channel(`task-changes:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, onTaskChange)
      .subscribe((status) => {
        const s = (status as SubStatus) ?? "UNKNOWN";
        taskSubStatusRef.current = s;
        setTaskSubStatus(s);
      });

    //deadline（statusは監視しない）
    deadlineChannelRef.current = supabase
      .channel(`deadline-changes:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deadline" }, onDeadlineChange)
      .subscribe();
  }, [user?.id, cleanupAll, onTaskChange, onDeadlineChange]);

  //手動再購読（taskがSUBSCRIBEDじゃない時に押す想定）
  const resubscribeAll = useCallback(() => {
    // 切れてないのに押してもOKにするなら、このifは外してもOK
    if (taskSubStatusRef.current === "SUBSCRIBED") return;

    subscribeAll();

    //再同期
    getTasks();

    toast.success("Realtimeを再接続しました。");
  }, [subscribeAll, getTasks]);

  useEffect(() => {
    if (!user?.id) return;

    setIsReady(true);

    //初回同期
    getTasks();

    //初回購読
    subscribeAll();

    //タブ復帰：同期だけ（取りこぼし補完）
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        console.log("タブ復帰 → 再同期しました");
        getTasks();
        // toast.success("タスクの同期が完了しました。");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      cleanupAll();
    };
  }, [user?.id, getTasks, subscribeAll, cleanupAll]);


  const updateTaskStatus = async (
    taskId: string,
    newStatus: string,
    prevStatus: string,
    extraFields?: Partial<Task>
  ) => {
    //即時UI更新
    setTaskList((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, ...extraFields } : t))
    );

    //DB更新
    if (newStatus === "確認中") {
      const { error: finishError } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          finish_date: new Date().toLocaleDateString("sv-SE"),
          ...extraFields,
        })
        .eq("id", taskId);

      if (finishError) {
        console.error(finishError);
        setTaskList((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
        );
      }
    } else if (newStatus === "完了") {
      const { error: finishError } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          finish_date: extraFields?.finish_date ?? new Date().toLocaleDateString("sv-SE"),
          ...extraFields,
        })
        .eq("id", taskId);

      if (finishError) {
        console.error(finishError);
        setTaskList((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
        );
      }
    } else {
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ status: newStatus, ...extraFields })
        .eq("id", taskId);

      if (updateError) {
        console.error(updateError);
        setTaskList((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
        );
      }
    }
  };

  return {
    taskList,
    updateTaskStatus,
    sortTask,
    deadlineList,
    isReady,

    taskSubStatus,
    resubscribeAll,

    getTasks,
  };
}
