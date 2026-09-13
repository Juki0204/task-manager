"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { supabase } from "@/utils/supabase/supabase";

type EditingRow = {
  record_id: string;
  field_name?: string | null;
  user_id: string;
};

type SubscribeStatus =
  | "idle"
  | "subscribing"
  | "subscribed"
  | "closed"
  | "timed_out"
  | "error";

type LockResult =
  | {
    success: true;
    lockerId: string;
  }
  | {
    success: false;
    lockerId: string | null;
  };

type InvoiceEditingContextValue = {
  status: SubscribeStatus;

  /**
   * 指定Invoiceを現在ロックしているユーザーID
   */
  getLockerId: (recordId: string) => string | null;

  /**
   * 指定Invoiceを現在ロックしているユーザー名
   */
  getLockerName: (recordId: string) => string | null;

  /**
   * 自分以外のユーザーによってロックされているか
   */
  isLockedByOther: (recordId: string, myUserId: string) => boolean;

  /**
   * 自分自身がロックしているか
   */
  isLockedByMe: (recordId: string, myUserId: string) => boolean;

  /**
   * 行ロック取得
   *
   * Realtimeの状態ではなく、
   * DB INSERTの成功をもってロック取得成功とする。
   */
  lock: (recordId: string, myUserId: string) => Promise<LockResult>;

  /**
   * 自分が保持している行ロックを解除
   */
  unlock: (recordId: string, myUserId: string) => Promise<void>;

  /**
   * Realtime購読を張り直す
   */
  resubscribe: () => void;

  /**
   * DBから現在のロック一覧を再取得
   */
  refreshLocks: () => Promise<void>;
};

const InvoiceEditingContext =
  createContext<InvoiceEditingContextValue | null>(null);

/**
 * 既存DBの field_name カラムを残したまま
 * 行ロックへ移行するための固定値。
 *
 * 将来的にfield_nameカラムを削除したら不要。
 */
const ROW_LOCK_FIELD_NAME = "__ROW__";

export function InvoiceEditingProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const [status, setStatus] = useState<SubscribeStatus>("idle");

  /**
   * recordId -> userId
   *
   * セル単位ではなくInvoice行単位で保持する。
   */
  const [lockMap, setLockMap] = useState<Map<string, string>>(
    () => new Map()
  );

  /**
   * userId -> userName
   */
  const [userMap, setUserMap] = useState<Map<string, string>>(
    () => new Map()
  );

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  /**
   * ユーザー一覧取得
   */
  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name");

      if (error) {
        console.error(
          "[InvoiceEditingProvider] usersの取得に失敗しました:",
          error
        );
        return;
      }

      if (cancelled || !data) return;

      const nextMap = new Map<string, string>();

      data.forEach((user) => {
        nextMap.set(user.id, user.name);
      });

      setUserMap(nextMap);
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * DBから現在存在している行ロックを全取得。
   *
   * Realtimeは「購読開始後の変更」しか拾わないため、
   * Provider起動時点ですでに存在しているロックを
   * 必ずここで同期する。
   */
  const refreshLocks = useCallback(async () => {
    if (!enabledRef.current) {
      setLockMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("invoice_editing_state")
      .select("record_id, field_name, user_id")
      .eq("field_name", ROW_LOCK_FIELD_NAME);

    if (error) {
      console.error(
        "[InvoiceEditingProvider] ロック一覧の取得に失敗しました:",
        error
      );
      return;
    }

    const nextMap = new Map<string, string>();

    data?.forEach((row) => {
      if (!row.record_id || !row.user_id) return;

      nextMap.set(row.record_id, row.user_id);
    });

    setLockMap(nextMap);
  }, []);

  /**
   * Realtime Channel削除
   */
  const cleanup = useCallback(() => {
    const channel = channelRef.current;

    if (!channel) return;

    void supabase.removeChannel(channel);

    channelRef.current = null;
  }, []);

  /**
   * Realtime購読
   */
  const subscribe = useCallback(() => {
    cleanup();

    if (!enabledRef.current) {
      setStatus("idle");
      setLockMap(new Map());
      return;
    }

    setStatus("subscribing");

    const channel = supabase
      .channel("invoice_editing_state:row-lock")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoice_editing_state",
        },
        (
          payload: RealtimePostgresChangesPayload<EditingRow>
        ) => {
          const row =
            payload.eventType === "DELETE"
              ? (payload.old as EditingRow | null)
              : (payload.new as EditingRow | null);

          /**
           * DELETE時にReplica Identity等の関係で
           * record_idが取得できなかった場合は、
           * ロック一覧をDBから再同期する。
           */
          if (!row?.record_id) {
            console.warn(
              "[InvoiceEditingProvider] Realtimeイベントからrecord_idを取得できませんでした。",
              payload
            );

            void refreshLocks();
            return;
          }

          /**
           * 旧セルロックがDBに残っている場合は無視。
           */
          if (
            row.field_name &&
            row.field_name !== ROW_LOCK_FIELD_NAME
          ) {
            return;
          }

          const recordId = row.record_id;

          setLockMap((prev) => {
            const next = new Map(prev);

            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              if (!row.user_id) {
                void refreshLocks();
                return prev;
              }

              next.set(recordId, row.user_id);
            }

            if (payload.eventType === "DELETE") {
              next.delete(recordId);
            }

            return next;
          });
        }
      )
      .subscribe((subscriptionStatus) => {
        switch (subscriptionStatus) {
          case "SUBSCRIBED":
            setStatus("subscribed");

            /**
             * 購読開始以前から存在するロックを同期。
             */
            void refreshLocks();
            break;

          case "CLOSED":
            setStatus("closed");
            break;

          case "TIMED_OUT":
            setStatus("timed_out");
            break;

          case "CHANNEL_ERROR":
            setStatus("error");
            break;

          default:
            break;
        }
      });

    channelRef.current = channel;
  }, [cleanup, refreshLocks]);

  /**
   * enabled変更時に購読開始/解除
   */
  useEffect(() => {
    subscribe();

    return cleanup;
  }, [enabled, subscribe, cleanup]);

  /**
   * 行ロック取得
   *
   * 重要：
   * lockMapの状態ではなくINSERT結果を正とする。
   *
   * これにより、
   *
   * AとBが同時にクリック
   * ↓
   * A INSERT成功
   * B unique violation
   *
   * とDBレベルで競合を防げる。
   */
  const lock = useCallback(
    async (
      recordId: string,
      myUserId: string
    ): Promise<LockResult> => {
      /**
       * 自分がすでにロック済みなら再INSERT不要。
       */
      const currentLockerId = lockMap.get(recordId);

      if (currentLockerId === myUserId) {
        return {
          success: true,
          lockerId: myUserId,
        };
      }

      /**
       * Realtime上ですでに他人のロックが分かっている場合。
       *
       * DB問い合わせを減らすため早期returnする。
       */
      if (
        currentLockerId &&
        currentLockerId !== myUserId
      ) {
        return {
          success: false,
          lockerId: currentLockerId,
        };
      }

      const { error } = await supabase
        .from("invoice_editing_state")
        .insert({
          record_id: recordId,
          field_name: ROW_LOCK_FIELD_NAME,
          user_id: myUserId,
        });

      if (!error) {
        /**
         * Realtime反映を待たず、自分の画面では即座にロック状態へ。
         */
        setLockMap((prev) => {
          const next = new Map(prev);
          next.set(recordId, myUserId);
          return next;
        });

        return {
          success: true,
          lockerId: myUserId,
        };
      }

      /**
       * 23505:
       * PostgreSQL unique_violation
       *
       * 他ユーザーがほぼ同時に先にロックした可能性が高い。
       */
      if (error.code === "23505") {
        const { data, error: fetchError } = await supabase
          .from("invoice_editing_state")
          .select("record_id, user_id")
          .eq("record_id", recordId)
          .maybeSingle();

        if (fetchError) {
          console.error(
            "[InvoiceEditingProvider] 競合ロック取得後の確認に失敗しました:",
            fetchError
          );

          await refreshLocks();

          return {
            success: false,
            lockerId: null,
          };
        }

        const lockerId = data?.user_id ?? null;

        if (lockerId) {
          setLockMap((prev) => {
            const next = new Map(prev);
            next.set(recordId, lockerId);
            return next;
          });
        }

        /**
         * 自分自身の既存ロックだった場合は成功扱い。
         */
        if (lockerId === myUserId) {
          return {
            success: true,
            lockerId,
          };
        }

        return {
          success: false,
          lockerId,
        };
      }

      console.error(
        "[InvoiceEditingProvider] 行ロック取得に失敗しました:",
        {
          recordId,
          myUserId,
          error,
        }
      );

      throw error;
    },
    [lockMap, refreshLocks]
  );

  /**
   * 行ロック解除
   *
   * lockerIdをフロントで確認しない。
   *
   * DELETE条件にuser_idを含めることで、
   * 他ユーザーのロックを誤って解除することはない。
   */
  const unlock = useCallback(
    async (
      recordId: string,
      myUserId: string
    ): Promise<void> => {
      const { error } = await supabase
        .from("invoice_editing_state")
        .delete()
        .eq("record_id", recordId)
        .eq("user_id", myUserId);

      if (error) {
        console.error(
          "[InvoiceEditingProvider] 行ロック解除に失敗しました:",
          {
            recordId,
            myUserId,
            error,
          }
        );

        throw error;
      }

      /**
       * Realtimeを待たず自画面は即解除。
       *
       * ただし、自分のロックである場合のみ削除。
       */
      setLockMap((prev) => {
        if (prev.get(recordId) !== myUserId) {
          return prev;
        }

        const next = new Map(prev);
        next.delete(recordId);

        return next;
      });
    },
    []
  );

  /**
   * Context API
   */
  const contextValue = useMemo<InvoiceEditingContextValue>(
    () => ({
      status,

      getLockerId(recordId) {
        return lockMap.get(recordId) ?? null;
      },

      getLockerName(recordId) {
        const lockerId = lockMap.get(recordId);

        if (!lockerId) return null;

        return userMap.get(lockerId) ?? lockerId;
      },

      isLockedByOther(recordId, myUserId) {
        const lockerId = lockMap.get(recordId);

        return (
          lockerId !== undefined &&
          lockerId !== myUserId
        );
      },

      isLockedByMe(recordId, myUserId) {
        return lockMap.get(recordId) === myUserId;
      },

      lock,

      unlock,

      refreshLocks,

      resubscribe() {
        subscribe();
      },
    }),
    [
      status,
      lockMap,
      userMap,
      lock,
      unlock,
      refreshLocks,
      subscribe,
    ]
  );

  return (
    <InvoiceEditingContext.Provider value={contextValue}>
      {children}
    </InvoiceEditingContext.Provider>
  );
}

export function useInvoiceEditing() {
  const context = useContext(InvoiceEditingContext);

  if (!context) {
    throw new Error(
      "useInvoiceEditing must be used within InvoiceEditingProvider"
    );
  }

  return context;
}