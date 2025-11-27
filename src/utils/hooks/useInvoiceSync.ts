"use client";

import { useCallback } from "react";
import { supabase } from "../supabase/supabase";


export function useInvoiceSync() {
  const syncInvoiceWithTask = useCallback(async (taskId: string, newStatus: string) => {
    try {
      if (newStatus === "完了") {
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .single();

        if (taskError || !task) {
          console.error("タスク取得失敗:", taskError);
          return;
        }

        // 作業点数自動判別（全角数字対応）
        function extractPoints(text: string): number | null {
          const matchResult = text.match(/([\d０-９]+)\s*点/);

          if (matchResult) {
            const half = matchResult[1].replace(/[０-９]/g, (d) =>
              String.fromCharCode(d.charCodeAt(0) - 0xfee0)
            );
            return Number(half);
          }

          return null;
        }
        const matchLength = extractPoints(task.description);

        const { data: existing } = await supabase
          .from("invoice")
          .select("id")
          .eq("id", taskId)
          .maybeSingle();

        const invoicePayload = {
          id: taskId,
          client: task.client,
          requester: task.requester,
          title: task.title,
          description: task.description,
          finish_date: task.finish_date,
          manager: task.manager,
          remarks: null,
          created_at: task.created_at,
          serial: task.serial,
          work_name: null,
          amount: null,
          category: null,
          device: null,
          degree: null,
          pieces: matchLength,
          work_time: null,
          adjustment: null,
          total_amount: null,
          // embedding: null,
        };

        if (existing) {
          await supabase
            .from("invoice")
            .update(invoicePayload)
            .eq("id", taskId);

        } else {
          await supabase
            .from("invoice")
            .insert(invoicePayload);
        }
      }

      //一度完了になってから再度作業状況が戻った場合
      else {
        // ベクトル付きのレコードを削除
        const { error: deleteError } = await supabase
          .from("invoice")
          .delete()
          .eq("id", taskId);

        if (deleteError) console.error("invoice削除失敗:", deleteError);
        else console.log("invoiceから削除しました");
      }
    } catch (err) {
      console.error("同期エラー:", err);
    }
  }, []);

  return { syncInvoiceWithTask };
}