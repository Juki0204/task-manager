"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";
import { Invoice } from "@/utils/types/invoice";
import { useInvoiceEditing } from "@/components/invoice/InvoiceEditingProvider";

interface UseCellEditProps {
  recordId: string;
  field: string;
  userId: string;
}

export function useCellEdit({ recordId, field, userId }: UseCellEditProps) {
  const editing = useInvoiceEditing();
  const [saving, setSaving] = useState(false);

  const lockerId = editing.getLockerId(recordId, field);
  const lockedByOther = lockerId !== null && lockerId !== userId;
  const lockedUser = editing.getLockerName(recordId, field) ?? "";

  const calcAmountTarget: string[] = ["work_name", "media", "degree", "adjustment", "pieces"];

  //セルロック
  const handleEditStart = useCallback(async () => {
    if (lockedByOther) return false;
    await editing.lock(recordId, field, userId);
    console.log("セルがロックされます｜record:", recordId, "field:", field, "userId:", userId);
    return true;
  }, [editing, field, lockedByOther, recordId, userId]);

  //ロック解除
  const handleCancel = useCallback(async () => {
    //自分がロックしてる場合のみ解除
    if (lockerId === userId) {
      await editing.unlock(recordId, field, userId);
    }
    console.log("ロックが解除されます｜record:", recordId, "field:", field, "userId:", userId);
  }, [editing, field, lockerId, recordId, userId]);


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


  const handleSave = useCallback(
    async (newValue: string | number, oldValue: string | number, tableName: string = "invoice") => {

      if (newValue === oldValue) return;
      setSaving(true);

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
      } finally {
        setSaving(false);
        if (lockerId === userId) {
          await editing.unlock(recordId, field, userId);
        }
      }
    },
    [editing, field, lockerId, recordId, userId]
  );


  return useMemo(() => ({
    lockedByOther,
    lockedUser,
    saving,
    handleEditStart,
    handleSave,
    handleCancel,
    subscribeStatus: editing.status,
    resubscribe: editing.resubscribe,
  }), [editing, handleCancel, handleEditStart, handleSave, lockedByOther, lockedUser, saving]);
}




