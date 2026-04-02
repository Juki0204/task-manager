"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/utils/supabase/supabase";

interface TaskStatus {
  task_id: string;
  updated_by: string;
  updated_at: string | Date;
}

interface TaskAcknowledgement {
  task_id: string;
  acknowledged_by: string;
  acknowledged_at: string | Date;
}

interface TaskForUnreadCheck {
  id: string;
  manager?: string | null;
}

interface TaskUnreadContextValue {
  taskStatuses: TaskStatus[];
  taskAcknowledgements: TaskAcknowledgement[];
  isLoading: boolean;

  getTaskStatus: (taskId: string) => TaskStatus | undefined;
  getTaskAcknowledgement: (
    taskId: string,
    userName: string
  ) => TaskAcknowledgement | undefined;

  isTaskUnread: (task: TaskForUnreadCheck, userName: string) => boolean;

  refetch: () => Promise<void>;

  upsertTaskStatus: (status: TaskStatus) => void;
  removeTaskStatus: (taskId: string) => void;

  upsertTaskAcknowledgement: (ack: TaskAcknowledgement) => void;
  removeTaskAcknowledgement: (taskId: string, userName: string) => void;

  clearTaskRelations: (taskId: string) => void;
}

const TaskUnreadContext = createContext<TaskUnreadContextValue | null>(null);

interface TaskUnreadProviderProps {
  children: ReactNode;
}

/**
 * tasks_status:
 * - task_id
 * - updated_by
 * - updated_at
 *
 * tasks_acknowledgements:
 * - task_id
 * - acknowledged_by
 * - acknowledged_at
 */
export function TaskUnreadProvider({
  children,
}: TaskUnreadProviderProps) {
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [taskAcknowledgements, setTaskAcknowledgements] = useState<
    TaskAcknowledgement[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const taskStatusMap = useMemo(() => {
    const map = new Map<string, TaskStatus>();

    for (const status of taskStatuses) {
      map.set(status.task_id, status);
    }

    return map;
  }, [taskStatuses]);

  const taskAcknowledgementMap = useMemo(() => {
    const map = new Map<string, TaskAcknowledgement>();

    for (const ack of taskAcknowledgements) {
      map.set(`${ack.task_id}::${ack.acknowledged_by}`, ack);
    }

    return map;
  }, [taskAcknowledgements]);

  const getTaskStatus = useCallback(
    (taskId: string) => {
      return taskStatusMap.get(taskId);
    },
    [taskStatusMap]
  );

  const getTaskAcknowledgement = useCallback(
    (taskId: string, userName: string) => {
      return taskAcknowledgementMap.get(`${taskId}::${userName}`);
    },
    [taskAcknowledgementMap]
  );

  const upsertTaskStatus = useCallback((nextStatus: TaskStatus) => {
    setTaskStatuses((prev) => {
      const index = prev.findIndex((item) => item.task_id === nextStatus.task_id);

      if (index === -1) {
        return [...prev, nextStatus];
      }

      const next = [...prev];
      next[index] = nextStatus;
      return next;
    });
  }, []);

  const removeTaskStatus = useCallback((taskId: string) => {
    setTaskStatuses((prev) => prev.filter((item) => item.task_id !== taskId));
  }, []);

  const upsertTaskAcknowledgement = useCallback(
    (nextAck: TaskAcknowledgement) => {
      setTaskAcknowledgements((prev) => {
        const index = prev.findIndex(
          (item) =>
            item.task_id === nextAck.task_id &&
            item.acknowledged_by === nextAck.acknowledged_by
        );

        if (index === -1) {
          return [...prev, nextAck];
        }

        const next = [...prev];
        next[index] = nextAck;
        return next;
      });
    },
    []
  );

  const removeTaskAcknowledgement = useCallback(
    (taskId: string, userName: string) => {
      setTaskAcknowledgements((prev) =>
        prev.filter(
          (item) =>
            !(
              item.task_id === taskId && item.acknowledged_by === userName
            )
        )
      );
    },
    []
  );

  const clearTaskRelations = useCallback((taskId: string) => {
    setTaskStatuses((prev) => prev.filter((item) => item.task_id !== taskId));
    setTaskAcknowledgements((prev) =>
      prev.filter((item) => item.task_id !== taskId)
    );
  }, []);

  const isTaskUnread = useCallback(
    (task: TaskForUnreadCheck, userName: string) => {
      const status = getTaskStatus(task.id);

      if (!status) return false;
      if (status.updated_by === userName) return false;

      const isUnassigned = !task.manager;
      const isMyTask = task.manager === userName;

      if (!isUnassigned && !isMyTask) return false;

      const ack = getTaskAcknowledgement(task.id, userName);

      if (!ack) return true;

      return (
        new Date(ack.acknowledged_at).getTime() <
        new Date(status.updated_at).getTime()
      );
    },
    [getTaskAcknowledgement, getTaskStatus]
  );

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);

    const [statusRes, ackRes] = await Promise.all([
      supabase
        .from("tasks_status")
        .select("task_id, updated_by, updated_at"),
      supabase
        .from("tasks_acknowledgements")
        .select("task_id, acknowledged_by, acknowledged_at"),
    ]);

    if (statusRes.error) {
      console.error("[TaskUnreadProvider] tasks_status fetch error:", statusRes.error);
    }

    if (ackRes.error) {
      console.error(
        "[TaskUnreadProvider] tasks_acknowledgements fetch error:",
        ackRes.error
      );
    }

    setTaskStatuses((statusRes.data ?? []) as TaskStatus[]);
    setTaskAcknowledgements((ackRes.data ?? []) as TaskAcknowledgement[]);
    setIsLoading(false);
  }, [supabase]);

  const refetch = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const tasksStatusChannel = supabase
      .channel("tasks-status-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks_status", },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const row = payload.new as TaskStatus;
            upsertTaskStatus(row);
          }

          if (payload.eventType === "DELETE") {
            const row = payload.old as TaskStatus;
            removeTaskStatus(row.task_id);
          }
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.log("[TaskUnreadProvider] tasks_status subscribe status:", status);
        }
      });

    const tasksAcknowledgementsChannel = supabase
      .channel("tasks-acknowledgements-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks_acknowledgements",
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const row = payload.new as TaskAcknowledgement;
            upsertTaskAcknowledgement(row);
          }

          if (payload.eventType === "DELETE") {
            const row = payload.old as TaskAcknowledgement;
            removeTaskAcknowledgement(row.task_id, row.acknowledged_by);
          }
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.log(
            "[TaskUnreadProvider] tasks_acknowledgements subscribe status:",
            status
          );
        }
      });

    return () => {
      void supabase.removeChannel(tasksStatusChannel);
      void supabase.removeChannel(tasksAcknowledgementsChannel);
    };
  }, [
    supabase,
    upsertTaskStatus,
    removeTaskStatus,
    upsertTaskAcknowledgement,
    removeTaskAcknowledgement,
  ]);

  const value = useMemo<TaskUnreadContextValue>(
    () => ({
      taskStatuses,
      taskAcknowledgements,
      isLoading,

      getTaskStatus,
      getTaskAcknowledgement,
      isTaskUnread,

      refetch,

      upsertTaskStatus,
      removeTaskStatus,

      upsertTaskAcknowledgement,
      removeTaskAcknowledgement,

      clearTaskRelations,
    }),
    [
      taskStatuses,
      taskAcknowledgements,
      isLoading,
      getTaskStatus,
      getTaskAcknowledgement,
      isTaskUnread,
      refetch,
      upsertTaskStatus,
      removeTaskStatus,
      upsertTaskAcknowledgement,
      removeTaskAcknowledgement,
      clearTaskRelations,
    ]
  );

  return (
    <TaskUnreadContext.Provider value={value}>
      {children}
    </TaskUnreadContext.Provider>
  );
}

export function useTaskUnread() {
  const context = useContext(TaskUnreadContext);

  if (!context) {
    throw new Error("useTaskUnread must be used within a TaskUnreadProvider");
  }

  return context;
}