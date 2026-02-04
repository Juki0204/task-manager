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

  const calcAmountTarget: string[] = ["work_name", "media", "degree", "adjustment", "pieces"];

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

  const formatNullValue = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const str = value.trim();
      if (str === "") return null;
      const num = Number(str);
      return Number.isFinite(num) ? num : null;
    }
    return null;
  }

  const mediaFactor = (media: string | null | undefined): number => media && media.includes("会員サイト") ? 1.5 : 1;

  const safeAmount = (num: number): number => (Number.isFinite(num) ? num : 0);

  async function handleSave(
    newValue: string | number,
    oldValue: string | number,
    tableName: string = "invoice"
  ) {
    console.log(newValue, oldValue, tableName);
    if (newValue === oldValue) return;

    try {
      const formatNewValue = newValue === "" ? null : newValue;
      const isCalcField = calcAmountTarget.includes(field);

      const { data: invoice, error: invoiceErr } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", recordId)
        .maybeSingle();

      if (invoiceErr) {
        console.error("invoiceのフェッチに失敗しました:", invoiceErr);
        return;
      }

      if (!invoice) {
        console.error("invoiceがありません。");
        return;
      }

      const target = invoice as Invoice;

      //作業点数
      const nextPieces = field === "pieces"
        ? formatNullValue(formatNewValue) ?? 1
        : formatNullValue(target.pieces) ?? 1;

      //仮請求額
      let nextAmount = formatNullValue(target.amount) ?? 0;

      //作業デバイス（計算用係数）
      const nextMediaFactor = field === "media"
        ? mediaFactor(typeof formatNewValue === "string" ? formatNewValue : null)
        : mediaFactor(target.media ?? null);

      //修正度
      const nextDegree = field === "degree"
        ? formatNullValue(formatNewValue) ?? 100
        : formatNullValue(target.degree) ?? 100;

      //修正金額
      const nextAdjustment = field === "adjustment"
        ? formatNullValue(formatNewValue) ?? 0
        : formatNullValue(target.adjustment) ?? 0;


      // ---------------- work_name 変更時 ----------------
      if (field === "work_name") {
        const { data: priceRow, error: priceErr } = await supabase
          .from("prices")
          .select("price, category")
          .eq("work_name", formatNewValue)
          .maybeSingle();

        if (priceErr) {
          console.error("priceのフェッチに失敗しました:", priceErr);
          return;
        }

        if (!priceRow) {
          const { error } = await supabase
            .from(tableName)
            .update({
              "work_name": null,
              "amount": 0,
              "category": null,
              "total_amount": 0
            })
            .eq("id", recordId);

          if (error) console.error("請求データの更新に失敗しました:", error);
          return;
        }

        nextAmount = formatNullValue(priceRow.price) ?? 0;

        const preAmount = safeAmount(nextAmount) * nextPieces * nextMediaFactor * (nextDegree * 0.01)
        const total = preAmount + nextAdjustment;

        const { error } = await supabase
          .from(tableName)
          .update({
            "work_name": formatNewValue,
            "amount": safeAmount(preAmount),
            "category": priceRow.category ?? null,
            "total_amount": safeAmount(total),
          })
          .eq("id", recordId);

        if (error) console.error("請求データの更新に失敗しました:", error);
        return;
      }


      // ---------------- work_name 以外の計算に関係する箇所の変更時 ----------------
      if (isCalcField) {

        const { data: priceRow, error: priceErr } = await supabase
          .from("prices")
          .select("price, category")
          .eq("work_name", target.work_name)
          .maybeSingle();

        if (priceErr) {
          console.error("priceのフェッチに失敗しました:", priceErr);
          return;
        }

        nextAmount = formatNullValue(priceRow?.price) ?? 0;

        const preAmount = safeAmount(nextAmount) * nextPieces * nextMediaFactor * (nextDegree * 0.01);
        const total = preAmount + nextAdjustment;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatePayload: Record<string, any> = {
          amount: safeAmount(preAmount),
          total_amount: safeAmount(total),
        };

        if (field === "pieces" || field === "degree" || field === "adjustment") {
          updatePayload[field] = formatNullValue(formatNewValue);
        } else if (field === "media") {
          updatePayload.media = typeof formatNewValue === "string" && formatNewValue.trim() !== "" ? formatNewValue : null;
        } else if (field === "amount") {
          updatePayload.amount = formatNullValue(formatNewValue);
        } else {
          updatePayload[field] = formatNewValue ?? null;
        }

        const { error } = await supabase
          .from(tableName)
          .update(updatePayload)
          .eq("id", recordId);

        if (error) console.error("請求データの更新に失敗しました:", error);

        //請求単価が取得できなかった（work_name入力無し等）場合や、対象がなかった場合
        if (priceRow === null || priceRow === undefined) {
          const { error } = await supabase
            .from(tableName)
            .update({
              "work_name": null,
              "amount": 0,
              "category": null,
              "total_amount": 0
            })
            .eq("id", recordId);

          if (error) console.error("請求データの更新に失敗しました:", error);
          return;
        }
      } else {

        // ---------------- 上記以外の計算に関係しない箇所の変更時 ----------------
        if (field === "description") { //description変更時は点数を自動抽出
          //点数抽出でpieces自動入力
          const extractPoints = (text: string): number | null => {
            const matchResult = text.match(/([\d０-９]+)\s*点/);
            if (!matchResult) return null;

            const half = matchResult[1].replace(/[０-９]/g, (d) =>
              String.fromCharCode(d.charCodeAt(0) - 0xfee0)
            );

            if (Number(half) <= 1) {
              return null;
            }

            return Number.isFinite(Number(half)) ? Number(half) : null;
          }

          const matchLength = typeof formatNewValue === "string" ? extractPoints(formatNewValue) : null;

          const { error } = await supabase
            .from(tableName)
            .update({ [field]: formatNewValue ?? null, "pieces": matchLength })
            .eq("id", recordId);

          if (error) console.error("請求データの更新に失敗しました:", error);

        } else { //それ以外は通常格納
          const { error } = await supabase
            .from(tableName)
            .update({ [field]: formatNewValue ?? null })
            .eq("id", recordId);

          if (error) console.error("請求データの更新に失敗しました:", error);
        }
      }
    } catch (err) {
      console.error("handleSave関数の処理を完了できませんでした:", err);
    }
    // finally {
    //   console.log("請求データの更新が完了しました。");
    // }

    const { error: delErr } = await supabase
      .from("invoice_editing_state")
      .delete()
      .eq("record_id", recordId)
      .eq("field_name", field)
      .eq("user_id", userId);

    if (delErr) console.error("編集状態をアンロックできませんでした:", delErr);
  }

  return {
    lockedByOther,
    lockedUser,
    handleEditStart,
    handleSave,
  };

}




