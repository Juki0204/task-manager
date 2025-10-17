"use client";

import { useCallback } from "react";
import { supabase } from "../supabase/supabase";
import stringSimilarity from "string-similarity";

import { Task } from "../types/task";

type Price = {
  work_name: string;
  price: number;
}

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

        const { data: prices, error: priceError } = await supabase
          .from("prices")
          .select("work_name, price");

        if (priceError || !prices) {
          console.error("prices取得失敗:", priceError);
          return;
        }

        const targetText = `${task.title} ${task.description ?? ""}`;
        const bestMatch = stringSimilarity.findBestMatch(
          targetText,
          prices.map((p) => p.work_name)
        );

        const bestIndex = bestMatch.bestMatchIndex;
        const bestScore = bestMatch.bestMatch.rating;
        const matchedPrice = bestScore >= 0.4 ? prices[bestIndex].price : null;
        const matchedName = bestScore >= 0.4 ? prices[bestIndex].work_name : null;

        // invoiceへ追加
        const { error: invoiceError } = await supabase.from("invoice").upsert({
          id: task.id,
          client: task.client,
          requester: task.requester,
          title: task.title,
          description: task.description,
          finish_date: task.finish_date,
          manager: task.manager,
          remarks: task.remarks,
          created_at: task.created_at,
          serial: task.serial,
          work_name: matchedName,
          amount: matchedPrice,
          category: null,
          device: null,
          degree: null,
          work_time: null,
          adjustment: null,
          total_amount: matchedPrice,
        });

        if (invoiceError) {
          console.error("invoice登録失敗:", invoiceError);
        } else {
          console.log(`invoiceに登録しました（類似度: ${bestScore.toFixed(2)}）`);
        }
      }

      //一度完了になってから再度作業状況が戻った場合
      else {
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