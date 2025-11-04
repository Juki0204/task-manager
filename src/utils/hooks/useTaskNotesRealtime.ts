"use client"

import { useEffect, useState } from "react";
import { Task } from "../types/task";
import { supabase } from "../supabase/supabase";

export type TaskNote = {
  id: string;
  task_serial: string;
  message: string;
  diff: Partial<Record<keyof Task, string | null>>
  old_record: Partial<Record<keyof Task, string | null>>;
  new_record: Partial<Record<keyof Task, string | null>>;
  changed_by: string | null;
  changed_at: string;
  type: string;
}

export function useTaskNotesRealtime() {
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  const fetchNotes = async () => {
    const { data: notes, error } = await supabase
      .from("task_notes")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
      return;
    }

    setNotes(notes.reverse());
  }

  useEffect(() => {
    setIsReady(true);
    fetchNotes();

    const channel = supabase
      .channel("task-notes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_notes" },
        (payload) => {
          const newNote = payload.new as TaskNote;

          setNotes((prev) => {
            const update = [...prev, newNote];
            return update.slice(-50);
          });
        }
      )
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // console.log("タブ復帰 → 再購読しました");
        fetchNotes();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
    }
  }, []);

  return { notes, isReady };
}