"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import { Invoice } from "../types/invoice";

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

  const calcAmountTarget: string[] = ["work_name", "device", "degree", "adjustment", "pieces"];

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
      try {
        if (calcAmountTarget.includes(field)) { // 金額計算に影響があるフィールド
          const { data: invoice } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", recordId)
            .single();

          const target = invoice as Invoice;

          const calcList = {
            pieces: target.pieces ?? 1,
            amount: target.amount ?? 0,
            device: target.device === "会員サイト" ? 1.5 : 1,
            degree: target.degree ? target.degree : 100,
            adjustment: target.adjustment ?? 0,
          }

          if (field in calcList) {
            if (field === "device") {
              // device の場合は「会員サイト」なら 1.5、それ以外は 1
              calcList.device =
                typeof newValue === "string" && newValue.includes("会員サイト") ? 1.5 : 1;
            } else {
              // それ以外は数値変換して代入
              calcList[field as keyof typeof calcList] =
                typeof newValue === "string" ? Number(newValue) || 0 : newValue;
            }
          }

          if (field === "work_name") {

            const { data: price } = await supabase
              .from("prices")
              .select("price, category")
              .eq("work_name", newValue)
              .single();

            if (!price) return;

            // ( 仮請求額 × 作業点数 × デバイス（会員サイトのみ1.5） × 修正度 ) + 修正金額
            const resultAmount = (price.price * calcList.pieces * calcList.device * (calcList.degree * 0.01)) + calcList.adjustment;

            await supabase
              .from(tableName)
              .update({ "work_name": newValue, "amount": price.price, "category": price.category, "total_amount": resultAmount })
              .eq("id", recordId);

          } else {

            // ( 仮請求額 × 作業点数 × デバイス（会員サイトのみ1.5） × 修正度 ) + 修正金額
            const resultAmount = (calcList.amount * calcList.pieces * calcList.device * (calcList.degree * 0.01)) + calcList.adjustment;

            await supabase
              .from(tableName)
              .update({ [field]: newValue, "total_amount": resultAmount })
              .eq("id", recordId);
          }

        } else {

          await supabase
            .from(tableName)
            .update({ [field]: newValue })
            .eq("id", recordId);
        }
      } catch (err) {
        console.error(err);
      } finally {
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