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
    const channel = supabase.channel('task-presence', {
      config: { presence: { key: currentUser.id } },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && active) {
        channel.track({
          taskId,
          mode: "edit",
          userId: currentUser.id,
          userName: currentUser.name,
        });
        console.log("track called", { taskId, userId: currentUser.id, userName: currentUser.name });
      }
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as PresenceState;
      console.log("presence state", state);

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

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    }
  }, [taskId, currentUser.id, currentUser.name, active]);

  return editingUser;
}