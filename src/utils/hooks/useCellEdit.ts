"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";

interface UseCellEditProps {
  recordId: string;
  field: string;
  userId: string;
}

interface InvoiceEditingStateTable {
  record_id: string;
  field_name: string;
  user_id: string;
}

export function useCellEdit({ recordId, field, userId }: UseCellEditProps) {
  const [lockedByOther, setLockedByOther] = useState<boolean>(false);
  const [lockedUser, setLockedUser] = useState<string>("");

  useEffect(() => {
    const channel = supabase
      .channel("invoice_editing_state")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoice_editing_state" },
        (payload) => {
          const target = (payload.new ?? payload.old) as InvoiceEditingStateTable | null;
          if (!target) return;
          if (target.record_id === recordId && target.field_name === field) {
            if (payload.eventType === "INSERT" && target.user_id !== userId) {
              setLockedByOther(true);
              setLockedUser(target.user_id);
            } else if (payload.eventType === "DELETE") {
              setLockedByOther(false);
              setLockedUser("");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [recordId, field, userId]);

  async function handleEditStart() {
    if (lockedByOther) return;
    await supabase
      .from("invoice_editing_state")
      .upsert({
        record_id: recordId,
        field_name: field,
        user_id: userId,
      });

    return true;
  }

  async function handleSave(newValue: string | number, oldValue: string | number, tableName: string = "invoice") {
    if (newValue !== oldValue) {
      const { error } = await supabase
        .from(tableName)
        .update({ [field]: newValue })
        .eq("id", recordId);

      if (error) {
        console.error(error);
      } else {
        console.log("Success to Update Invoice.");
      }
    }

    await supabase
      .from("invoice_editing_state")
      .delete()
      .eq("record_id", recordId)
      .eq("field_name", field)
      .eq("user_id", userId);
  }

  return {
    lockedByOther,
    lockedUser,
    handleEditStart,
    handleSave,
  };
}