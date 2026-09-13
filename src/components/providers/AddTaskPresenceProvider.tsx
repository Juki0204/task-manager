"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type AddTaskPresenceUser = {
  userId: string;
  userName: string;
  activity: "idle" | "adding-task";
  taskTitle: string;
};

type AddTaskPresenceContextValue = {
  addingUsers: AddTaskPresenceUser[];
  startAddingTask: () => Promise<void>;
  updateAddingTaskTitle: (title: string) => Promise<void>;
  stopAddingTask: () => Promise<void>;
};

const AddTaskPresenceContext =
  createContext<AddTaskPresenceContextValue | null>(null);

type AddTaskPresenceProviderProps = {
  children: ReactNode;
  userId: string;
  userName: string;
};

export function AddTaskPresenceProvider({
  children,
  userId,
  userName,
}: AddTaskPresenceProviderProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [addingUsers, setAddingUsers] = useState<
    AddTaskPresenceUser[]
  >([]);

  const ownPresenceRef = useRef<AddTaskPresenceUser>({
    userId,
    userName,
    activity: "idle",
    taskTitle: "",
  });

  /**
   * 自分のPresenceを更新
   */
  const trackPresence = useCallback(
    async (
      updates: Partial<
        Pick<AddTaskPresenceUser, "activity" | "taskTitle">
      >
    ) => {
      const channel = channelRef.current;

      if (!channel) {
        console.warn("[Presence] channel is not ready");
        return;
      }

      const nextPresence: AddTaskPresenceUser = {
        ...ownPresenceRef.current,
        ...updates,
        userId,
        userName,
      };

      ownPresenceRef.current = nextPresence;

      console.log("[Presence] track:", nextPresence);

      const result = await channel.track(nextPresence);

      console.log("[Presence] track result:", result);
    },
    [userId, userName]
  );

  /**
   * AddTaskを開いた
   */
  const startAddingTask = useCallback(async () => {
    await trackPresence({
      activity: "adding-task",
      taskTitle: "",
    });
  }, [trackPresence]);

  /**
   * タイトル入力後に更新
   *
   * onBlurで呼ぶ想定
   */
  const updateAddingTaskTitle = useCallback(
    async (title: string) => {
      await trackPresence({
        activity: "adding-task",
        taskTitle: title.trim(),
      });
    },
    [trackPresence]
  );

  /**
   * AddTaskを閉じた
   */
  const stopAddingTask = useCallback(async () => {
    await trackPresence({
      activity: "idle",
      taskTitle: "",
    });
  }, [trackPresence]);

  /**
   * Presence接続・購読
   */
  useEffect(() => {
    const channel = supabase.channel("add-task-presence", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    const syncAddingUsers = () => {
      const state = channel.presenceState<AddTaskPresenceUser>();

      console.log("[Presence] sync state:", state);

      const users = Object.values(state)
        .flat()
        .filter(
          (presence) =>
            presence.activity === "adding-task" &&
            presence.userId !== userId
        );

      console.log("[Presence] adding users:", users);

      setAddingUsers(users);
    };

    channel
      .on("presence", { event: "sync" }, syncAddingUsers)
      .on("presence", { event: "join" }, syncAddingUsers)
      .on("presence", { event: "leave" }, syncAddingUsers)
      .subscribe(async (status) => {
        console.log("[Presence] channel status:", status);

        if (status !== "SUBSCRIBED") return;

        const initialPresence: AddTaskPresenceUser = {
          userId,
          userName,
          activity: "idle",
          taskTitle: "",
        };

        ownPresenceRef.current = initialPresence;

        console.log("[Presence] initial track:", initialPresence);

        await channel.track(initialPresence);
      });

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [userId, userName]);

  const value = useMemo<AddTaskPresenceContextValue>(
    () => ({
      addingUsers,
      startAddingTask,
      updateAddingTaskTitle,
      stopAddingTask,
    }),
    [
      addingUsers,
      startAddingTask,
      updateAddingTaskTitle,
      stopAddingTask,
    ]
  );

  return (
    <AddTaskPresenceContext.Provider value={value}>
      {children}
    </AddTaskPresenceContext.Provider>
  );
}

export function useAddTaskPresence() {
  const context = useContext(AddTaskPresenceContext);

  if (!context) {
    throw new Error(
      "useAddTaskPresence must be used within AddTaskPresenceProvider"
    );
  }

  return context;
}