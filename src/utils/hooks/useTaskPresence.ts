import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";

interface PresenceUser {
  userId: string;
  userName: string;
  taskId: string;
  mode: "edit" | "detail";
}

type PresenceState = Record<string, PresenceUser[]>;

export function useTaskPresence(
  taskId: string,
  currentUser: {
    id: string,
    name: string,
  },
  active: boolean,
) {
  const [editingUser, setEditingUser] = useState<PresenceUser | null>(null);

  useEffect(() => {
    if (!taskId) return;
    if (!currentUser?.id) return;

    const channel = supabase.channel('task-presence', {
      config: { presence: { key: currentUser.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as PresenceState;
      // console.log("presence state", state);

      for (const [userId, session] of Object.entries(state)) {
        for (const s of session) {
          if (s.taskId === taskId && s.mode === "edit" && s.userId !== currentUser.id) {
            setEditingUser(s as PresenceUser);
            return;
          }
        }
      }
      setEditingUser(null);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && active) {
        channel.track({
          taskId,
          mode: "edit",
          userId: currentUser.id,
          userName: currentUser.name,
        });
        // console.log("track called", { taskId, userId: currentUser.id, userName: currentUser.name });
        // console.log("channel status:", status);
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    }
  }, [taskId, currentUser.id, currentUser.name, active]);

  return editingUser;
}




export function useTaskLock(taskId: string, currentUser: { id: string; name: string }) {
  useEffect(() => {
    const channel = supabase.channel(`task-${taskId}`, {
      config: { presence: { key: currentUser.id } },
    });

    // サブスク開始
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Presence subscribed:", taskId);
      }
    });

    // 離脱を検知
    channel.on("presence", { event: "leave" }, async ({ key }) => {
      console.log("User left:", key);

      // DB側のロック解除
      const { error } = await supabase
        .from("tasks")
        .update({
          locked_by_id: null,
          locked_by_name: null,
          locked_by_at: null,
        })
        .eq("id", taskId)
        .eq("locked_by_id", key); // ロック保持者本人だけ解除
      if (error) console.error("Failed to clear lock:", error);
    });

    return () => {
      // 自分が離脱した時のuntrack
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [taskId, currentUser.id, currentUser.name]);
}
