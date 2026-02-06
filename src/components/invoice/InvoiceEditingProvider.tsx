"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Invoice } from "@/utils/types/invoice";

type EditingRow = {
  record_id: string;
  field_name: string;
  user_id: string;
};

type LockKey = `${string}::${string}`;

type SubscribeStatus = "idle" | "subscribing" | "subscribed" | "closed" | "timed_out" | "error";

type Ctx = {
  status: SubscribeStatus;
  getLockerId: (recordId: string, field: string) => string | null;
  getLockerName: (recordId: string, field: string) => string | null;
  isLockedByOther: (recordId: string, field: string, myUserId: string) => boolean;
  lock: (recordId: string, field: string, myUserId: string) => Promise<void>;
  unlock: (recordId: string, field: string, myUserId: string) => Promise<void>;
  resubscribe: () => void;
};

const InvoiceEditingContext = createContext<Ctx | null>(null);

export function InvoiceEditingProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {

  const [status, setStatus] = useState<SubscribeStatus>("idle");
  const [lockMap, setLockMap] = useState<Map<LockKey, string>>(new Map());

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("users").select("id, name");
      if (!data) return;

      const map = new Map<string, string>();
      data.forEach((u) => {
        map.set(u.id, u.name);
      });

      setUserMap(map);
    })();
  }, []);

  const cleanup = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  //リアルタイム購読
  const subscribe = () => {
    cleanup();
    if (!enabledRef.current) return;

    setStatus("subscribing");

    const ch = supabase
      .channel("invoice_editing_state:global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoice_editing_state" },
        (payload: RealtimePostgresChangesPayload<EditingRow>) => {
          const row = (payload.new ?? payload.old) as EditingRow | null;
          if (!row) return;

          const key = `${row.record_id}::${row.field_name}` as LockKey;

          setLockMap((prev) => {
            const next = new Map(prev);

            // upsertがINSERT/UPDATEどっちもあり得るので両方ロック扱い
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              next.set(key, row.user_id);
              return next;
            }

            if (payload.eventType === "DELETE") {
              next.delete(key);
              return next;
            }

            return next;
          });
        }
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("subscribed");
        else if (s === "CLOSED") setStatus("closed");
        else if (s === "TIMED_OUT") setStatus("timed_out");
        else setStatus("error");
      });

    channelRef.current = ch;
  };

  useEffect(() => {
    subscribe();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);


  //ロック状態を管理するcontext作成
  const ctx = useMemo<Ctx>(() => {
    const makeKey = (recordId: string, field: string) =>
      `${recordId}::${field}` as LockKey;

    return {
      status,

      getLockerId(recordId: string, field: string) {
        const key = makeKey(recordId, field);
        return lockMap.get(key) ?? null;
      },

      getLockerName(recordId: string, field: string) {
        const userId = this.getLockerId(recordId, field);
        if (!userId) return null;
        return userMap.get(userId) ?? userId;
      },

      isLockedByOther(recordId, field, myUserId) {
        const lockerId = this.getLockerId(recordId, field);
        return lockerId !== null && lockerId !== myUserId;
      },

      async lock(recordId, field, myUserId) {
        const { error } = await supabase.from("invoice_editing_state").upsert({
          record_id: recordId,
          field_name: field,
          user_id: myUserId,
        });
        if (error) throw error;
      },

      async unlock(recordId, field, myUserId) {
        const { error } = await supabase
          .from("invoice_editing_state")
          .delete()
          .eq("record_id", recordId)
          .eq("field_name", field)
          .eq("user_id", myUserId);

        if (error) throw error;
      },

      resubscribe() {
        subscribe();
      },
    };
  }, [lockMap, status, userMap]);


  return <InvoiceEditingContext.Provider value={ctx}>{children}</InvoiceEditingContext.Provider>;
}

export function useInvoiceEditing() {
  const ctx = useContext(InvoiceEditingContext);
  if (!ctx) throw new Error("useInvoiceEditing must be used within InvoiceEditingProvider");
  return ctx;
}