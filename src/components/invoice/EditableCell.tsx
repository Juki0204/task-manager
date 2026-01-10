"use client";

import { useCellEdit } from "@/utils/hooks/useCellEdit";
import { supabase } from "@/utils/supabase/supabase";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";
import { Input } from "@headlessui/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface EditableCellProps {
  recordId: string;
  field: string;
  value: string | number;
  user: User;
  className?: string;
  type?: string;
  pattern?: string;
  inputMode?: "search" | "text" | "none" | "email" | "tel" | "url" | "numeric" | "decimal" | undefined;
  setInvoices: Dispatch<SetStateAction<Invoice[] | null>>;
  activeCell: { recordId: string; field: string } | null;
  setActiveCell: Dispatch<SetStateAction<{ recordId: string; field: string } | null>>;
  handleKeyNavigation: (key: "up" | "down" | "left" | "right") => void;
  registerCellRef: (id: string, field: string, el: HTMLDivElement | null) => void;
}

export default function EditableCell({
  recordId,
  field,
  value,
  user,
  className,
  type,
  pattern,
  inputMode,
  setInvoices,
  activeCell,
  setActiveCell,
  handleKeyNavigation,
  registerCellRef,
}: EditableCellProps) {
  const userId = user.id;
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string | number>(value);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { lockedByOther, lockedUser, handleEditStart, handleSave } = useCellEdit({
    recordId,
    field,
    userId,
  });

  const isActive = activeCell?.recordId === recordId && activeCell?.field === field;

  // 親にref登録（マウント・アンマウント時）
  useEffect(() => {
    registerCellRef(recordId, field, containerRef.current);
    return () => registerCellRef(recordId, field, null);
  }, [recordId, field, registerCellRef]);

  async function startEditing() {
    const ok = await handleEditStart();
    if (ok) setEditing(true);
  }

  async function saveValue() {
    setInvoices((prev) =>
      prev
        ? prev.map((inv) =>
          inv.id === recordId ? { ...inv, [field]: tempValue } : inv
        )
        : prev
    );

    setEditing(false);
    await handleSave(tempValue, value);

    const { data: task, error } = await supabase
      .from("invoice")
      .select("*")
      .eq("id", recordId)
      .single();

    if (error) {
      console.error(error);
      setInvoices((prev) =>
        prev
          ? prev.map((inv) =>
            inv.id === recordId ? { ...inv, [field]: value } : inv
          )
          : prev
      );
    }

    if (field === "title" && tempValue !== value) {
      toast.success(`${task.serial}の作業タイトルを変更しました`);
    } else if (field === "description" && tempValue !== value) {
      toast.success(`${task.serial}の作業内容を変更しました`);
    }
  }

  // キー操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return; //変換中は処理しない

    if (editing) {
      if (e.key === "Enter") {
        e.preventDefault();
        setEditing(false);
        saveValue();
        handleKeyNavigation(e.shiftKey ? "up" : "down");
      } else if (e.key === "Tab") {
        e.preventDefault();
        setEditing(false);
        saveValue();
        handleKeyNavigation(e.shiftKey ? "left" : "right");
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        startEditing();
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
        e.preventDefault();
        const map = {
          ArrowUp: "up",
          ArrowDown: "down",
          ArrowLeft: "left",
          ArrowRight: "right",
          Tab: e.shiftKey ? "left" : "right",
        } as const;
        handleKeyNavigation(map[e.key as keyof typeof map]);
      }
    }
  };

  return (
    <div
      data-record-id={recordId}
      data-field={field}
      ref={containerRef}
      tabIndex={isActive ? 0 : -1} // ロービング tabindex
      onDoubleClick={startEditing}
      onClick={(e) => {
        e.stopPropagation();
        setActiveCell({ recordId, field });
      }}
      onKeyDown={handleKeyDown}
      className={`border-neutral-700 py-1.5 px-2 min-h-8 ${className ?? ""}
        ${isActive ? "bg-blue-900/50 outline -outline-offset-1 outline-blue-700" : ""}
        ${editing ? "!bg-blue-800/40 !outline-blue-400" : ""}
        ${typeof value === "number" && value < 0 ? "text-red-400" : ""}
        h-full flex items-center
      `}
    >
      {lockedByOther && (
        <div className="editing-cell">
          <span className="editing-cell-text">{lockedUser}さんが編集中...</span>
        </div>
      )}

      {editing ? (
        <Input
          autoFocus
          autoComplete="off"
          name={`${recordId}-${field}`}
          className={`w-full h-full border data-focus:outline-0 data-focus:border-0 ${type === "tel" ? "text-right" : ""
            }`}
          type={type ?? "text"}
          value={tempValue}
          onChange={(e) => {
            if (type === "tel" || type === "number") {
              const v = e.target.value;
              if (v === "" || /^-?\d*$/.test(v)) {
                setTempValue(e.target.value);
              }
            } else {
              setTempValue(e.target.value);
            }
          }}
          onBlur={saveValue}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.stopPropagation()}
          max={type === "date" ? "9999-12-31" : undefined}
          pattern={pattern}
          inputMode={inputMode}
        />
      ) : (
        <>{value ?? ""}</>
      )}
    </div>
  );
}
