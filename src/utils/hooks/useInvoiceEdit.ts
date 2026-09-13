"use client";

import { useCallback, useMemo, useState } from "react";

import { useInvoiceEditing } from "@/components/invoice/InvoiceEditingProvider";
import { supabase } from "@/utils/supabase/supabase";
import { Invoice } from "@/utils/types/invoice";

interface UseInvoiceEditProps {
  recordId: string;
  field: string;
  userId: string;
}

type EditableValue = string | number | null;

type SaveResult =
  | {
    success: true;
    invoice: Invoice;
    changed: boolean;
  }
  | {
    success: false;
    invoice: null;
    changed: boolean;
    error?: unknown;
  };

type PriceRow = {
  price: number | null;
  category: string | null;
};

type CalculationValues = {
  basePrice: number;
  pieces: number;
  mediaFactor: number;
  degree: number;
  adjustment: number;
};

const CALCULATION_FIELDS = new Set([
  "work_name",
  "media",
  "degree",
  "adjustment",
  "pieces",
]);

/**
 * null / 空文字 / 不正値を安全にnumberへ変換する。
 */
function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (trimmedValue === "") {
      return null;
    }

    const numberValue = Number(trimmedValue);

    return Number.isFinite(numberValue)
      ? numberValue
      : null;
  }

  return null;
}

/**
 * NaN / InfinityなどがDBへ入らないようにする。
 */
function toSafeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * 空文字をnullとして扱う。
 */
function normalizeValue(
  value: string | number
): EditableValue {
  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return null;
  }

  return value;
}

/**
 * mediaによる請求倍率。
 */
function getMediaFactor(
  media: string | null | undefined
): number {
  return media === "会員" ? 1.5 : 1;
}

/**
 * DBへ保存する値として同一か判定。
 *
 * "" と null は同値扱い。
 */
function isSameValue(
  newValue: string | number,
  oldValue: string | number
): boolean {
  return (
    normalizeValue(newValue) ===
    normalizeValue(oldValue)
  );
}

/**
 * 金額計算。
 */
function calculateAmount({
  basePrice,
  pieces,
  mediaFactor,
  degree,
  adjustment,
}: CalculationValues) {
  const amount =
    basePrice *
    pieces *
    mediaFactor *
    (degree * 0.01);

  const totalAmount =
    amount + adjustment;

  return {
    amount: toSafeNumber(amount),
    totalAmount: toSafeNumber(totalAmount),
  };
}

export function useInvoiceEdit({
  recordId,
  field,
  userId,
}: UseInvoiceEditProps) {
  const editing = useInvoiceEditing();

  const [saving, setSaving] = useState(false);

  const lockerId =
    editing.getLockerId(recordId);

  const lockedByOther =
    lockerId !== null &&
    lockerId !== userId;

  const lockedByMe =
    lockerId === userId;

  const lockedUser =
    editing.getLockerName(recordId) ?? "";

  /**
   * Invoice最新情報取得。
   */
  const fetchInvoice = useCallback(
    async (
      tableName: string = "invoice"
    ): Promise<Invoice | null> => {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", recordId)
        .maybeSingle();

      if (error) {
        console.error(
          "[useInvoiceEdit] Invoice取得に失敗しました:",
          {
            recordId,
            error,
          }
        );

        return null;
      }

      if (!data) {
        console.error(
          "[useInvoiceEdit] Invoiceが存在しません:",
          recordId
        );

        return null;
      }

      return data as Invoice;
    },
    [recordId]
  );

  /**
   * 作業内容に紐づく単価取得。
   */
  const fetchPrice = useCallback(
    async (
      workName: string | null
    ): Promise<PriceRow | null> => {
      if (!workName) {
        return null;
      }

      const { data, error } = await supabase
        .from("prices")
        .select("price, category")
        .eq("work_name", workName)
        .maybeSingle();

      if (error) {
        console.error(
          "[useInvoiceEdit] 単価取得に失敗しました:",
          {
            workName,
            error,
          }
        );

        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        price: toNullableNumber(data.price),
        category: data.category ?? null,
      };
    },
    []
  );

  /**
   * 行ロック取得。
   */
  const handleEditStart =
    useCallback(async (): Promise<boolean> => {
      try {
        const result =
          await editing.lock(
            recordId,
            userId
          );

        return result.success;
      } catch (error) {
        console.error(
          "[useInvoiceEdit] 行ロック取得に失敗しました:",
          {
            recordId,
            field,
            userId,
            error,
          }
        );

        return false;
      }
    }, [
      editing,
      field,
      recordId,
      userId,
    ]);

  /**
   * 行ロック解除。
   *
   * lockerIdのRealtime状態には依存しない。
   */
  const handleUnlock =
    useCallback(async () => {
      try {
        await editing.unlock(
          recordId,
          userId
        );
      } catch (error) {
        console.error(
          "[useInvoiceEdit] 行ロック解除に失敗しました:",
          {
            recordId,
            field,
            userId,
            error,
          }
        );
      }
    }, [
      editing,
      field,
      recordId,
      userId,
    ]);

  /**
   * 通常フィールド保存。
   *
   * title / description / finish_date /
   * remarks 等。
   *
   * descriptionからpiecesを抽出する処理は
   * 完全に削除。
   */
  const saveNormalField =
    useCallback(
      async (
        value: EditableValue,
        tableName: string
      ): Promise<void> => {
        const { error } = await supabase
          .from(tableName)
          .update({
            [field]: value,
          })
          .eq("id", recordId);

        if (error) {
          throw error;
        }
      },
      [field, recordId]
    );

  /**
   * work_name変更。
   */
  const saveWorkName =
    useCallback(
      async (
        invoice: Invoice,
        value: EditableValue,
        tableName: string
      ): Promise<void> => {
        const workName =
          typeof value === "string"
            ? value
            : null;

        const price =
          await fetchPrice(workName);

        /**
         * pricesに存在しないwork_nameの場合。
         */
        if (!price) {
          const { error } =
            await supabase
              .from(tableName)
              .update({
                work_name: null,
                category: null,
                amount: 0,
                total_amount: 0,
              })
              .eq("id", recordId);

          if (error) {
            throw error;
          }

          return;
        }

        const calculation =
          calculateAmount({
            basePrice:
              price.price ?? 0,

            /**
             * pieces未入力時は
             * 従来仕様通り1点扱い。
             */
            pieces:
              toNullableNumber(
                invoice.pieces
              ) ?? 1,

            mediaFactor:
              getMediaFactor(
                invoice.media
              ),

            degree:
              toNullableNumber(
                invoice.degree
              ) ?? 100,

            adjustment:
              toNullableNumber(
                invoice.adjustment
              ) ?? 0,
          });

        const { error } = await supabase
          .from(tableName)
          .update({
            work_name: workName,
            category:
              price.category,
            amount:
              calculation.amount,
            total_amount:
              calculation.totalAmount,
          })
          .eq("id", recordId);

        if (error) {
          throw error;
        }
      },
      [fetchPrice, recordId]
    );

  /**
   * 金額計算に関係するフィールド保存。
   *
   * pieces
   * media
   * degree
   * adjustment
   */
  const saveCalculationField =
    useCallback(
      async (
        invoice: Invoice,
        value: EditableValue,
        tableName: string
      ): Promise<void> => {
        const price =
          await fetchPrice(
            invoice.work_name ?? null
          );

        /**
         * work_name無し、
         * またはpricesに存在しない場合。
         *
         * 編集したフィールド自体は保存しつつ、
         * 請求額は0へ戻す。
         */
        if (!price) {
          const payload: Record<
            string,
            unknown
          > = {
            [field]: value,
            category: null,
            amount: 0,
            total_amount: 0,
          };

          const { error } =
            await supabase
              .from(tableName)
              .update(payload)
              .eq("id", recordId);

          if (error) {
            throw error;
          }

          return;
        }

        /**
         * 編集中フィールドだけ新しい値、
         * その他は現在DB値を使う。
         */
        const pieces =
          field === "pieces"
            ? toNullableNumber(
              value
            ) ?? 1
            : toNullableNumber(
              invoice.pieces
            ) ?? 1;

        const media =
          field === "media"
            ? typeof value ===
              "string"
              ? value
              : null
            : invoice.media;

        const degree =
          field === "degree"
            ? toNullableNumber(
              value
            ) ?? 100
            : toNullableNumber(
              invoice.degree
            ) ?? 100;

        const adjustment =
          field === "adjustment"
            ? toNullableNumber(
              value
            ) ?? 0
            : toNullableNumber(
              invoice.adjustment
            ) ?? 0;

        const calculation =
          calculateAmount({
            basePrice:
              price.price ?? 0,
            pieces,
            mediaFactor:
              getMediaFactor(media),
            degree,
            adjustment,
          });

        const payload: Record<
          string,
          unknown
        > = {
          amount:
            calculation.amount,
          total_amount:
            calculation.totalAmount,
        };

        /**
         * 数値項目はnull / numberへ正規化。
         */
        if (
          field === "pieces" ||
          field === "degree" ||
          field === "adjustment"
        ) {
          payload[field] =
            toNullableNumber(value);
        } else {
          payload[field] = value;
        }

        const { error } = await supabase
          .from(tableName)
          .update(payload)
          .eq("id", recordId);

        if (error) {
          throw error;
        }
      },
      [
        fetchPrice,
        field,
        recordId,
      ]
    );

  /**
   * 値保存。
   *
   * ロック解除はここでは行わない。
   *
   * Editable側で
   *
   * save
   * ↓
   * UI state更新
   * ↓
   * unlock
   *
   * の順番を管理する。
   */
  const handleSave = useCallback(
    async (
      newValue: string | number,
      oldValue: string | number,
      tableName: string = "invoice"
    ): Promise<SaveResult> => {
      /**
       * 値が変わっていない場合でも、
       * 最新Invoiceを返しておく。
       */
      if (
        isSameValue(
          newValue,
          oldValue
        )
      ) {
        const invoice =
          await fetchInvoice(
            tableName
          );

        if (!invoice) {
          return {
            success: false,
            invoice: null,
            changed: false,
          };
        }

        return {
          success: true,
          invoice,
          changed: false,
        };
      }

      setSaving(true);

      try {
        const normalizedValue =
          normalizeValue(newValue);

        /**
         * 保存直前にDB最新値を取得。
         *
         * 行ロック導入後なので、
         * 他ユーザーによる同時更新は
         * 原則ここでは発生しない。
         */
        const invoice =
          await fetchInvoice(
            tableName
          );

        if (!invoice) {
          return {
            success: false,
            invoice: null,
            changed: true,
          };
        }

        if (field === "work_name") {
          await saveWorkName(
            invoice,
            normalizedValue,
            tableName
          );
        } else if (
          CALCULATION_FIELDS.has(
            field
          )
        ) {
          await saveCalculationField(
            invoice,
            normalizedValue,
            tableName
          );
        } else {
          await saveNormalField(
            normalizedValue,
            tableName
          );
        }

        /**
         * 保存完了後のDB最新状態を取得。
         *
         * amount / total_amount /
         * category 等の連動更新も含め、
         * このInvoiceをそのまま
         * フロントstateへ反映できる。
         */
        const updatedInvoice =
          await fetchInvoice(
            tableName
          );

        if (!updatedInvoice) {
          return {
            success: false,
            invoice: null,
            changed: true,
          };
        }

        return {
          success: true,
          invoice:
            updatedInvoice,
          changed: true,
        };
      } catch (error) {
        console.error(
          "[useInvoiceEdit] Invoice保存に失敗しました:",
          {
            recordId,
            field,
            newValue,
            error,
          }
        );

        return {
          success: false,
          invoice: null,
          changed: true,
          error,
        };
      } finally {
        setSaving(false);
      }
    },
    [
      fetchInvoice,
      field,
      recordId,
      saveCalculationField,
      saveNormalField,
      saveWorkName,
    ]
  );

  return useMemo(
    () => ({
      /**
       * ロック状態
       */
      lockedByOther,
      lockedByMe,
      lockedUser,

      /**
       * 保存状態
       */
      saving,

      /**
       * 操作
       */
      handleEditStart,
      handleSave,
      handleUnlock,
      fetchInvoice,

      /**
       * Realtime状態
       */
      subscribeStatus:
        editing.status,

      resubscribe:
        editing.resubscribe,
    }),
    [
      editing.resubscribe,
      editing.status,
      fetchInvoice,
      handleEditStart,
      handleSave,
      handleUnlock,
      lockedByMe,
      lockedByOther,
      lockedUser,
      saving,
    ]
  );
}