"use client";

import { useCellEdit } from "@/utils/hooks/useCellEdit";
import { supabase } from "@/utils/supabase/supabase";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";
import { Textarea } from "@headlessui/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface EditableCellProps {
  recordId: string;
  field: string;
  value: string;
  user: User;
  className?: string;
  setInvoices: Dispatch<SetStateAction<Invoice[] | null>>;
  activeCell: { recordId: string; field: string } | null;
  setActiveCell: Dispatch<SetStateAction<{ recordId: string; field: string } | null>>;
  handleKeyNavigation: (key: "up" | "down" | "left" | "right") => void;
  registerCellRef: (id: string, field: string, el: HTMLDivElement | null) => void;
}

export default function EditableTextarea({
  recordId,
  field,
  value,
  user,
  className,
  setInvoices,
  activeCell,
  setActiveCell,
  handleKeyNavigation,
  registerCellRef,
}: EditableCellProps) {
  const userId = user.id;
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string>(value);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { lockedByOther, lockedUser, handleEditStart, handleSave } = useCellEdit({
    recordId,
    field,
    userId,
  });

  const isActive = activeCell?.recordId === recordId && activeCell?.field === field;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 親にref登録（マウント・アンマウント時）
  useEffect(() => {
    registerCellRef(recordId, field, containerRef.current);
    return () => registerCellRef(recordId, field, null);
  }, [recordId, field, registerCellRef]);

  async function startEditing() {
    const ok = await handleEditStart();
    if (!ok) return;

    setTempValue(value ?? "");
    setEditing(true);
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


  const handleHeightChange = () => {
    if (!textareaRef.current) return;
    const ref = textareaRef.current;

    ref.style.height = "auto";
    ref.style.height = ref.scrollHeight + "px";
  }


  useEffect(() => {
    if (editing) return;
    setTempValue(value ?? "");
  }, [value, editing]);

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
        w-full h-full whitespace-pre-wrap
      `}
    >
      {lockedByOther && (
        <div className="editing-cell">
          <span className="editing-cell-text">{lockedUser}さんが編集中...</span>
        </div>
      )}

      {editing ? (
        <Textarea
          ref={textareaRef}
          rows={1}
          autoFocus
          autoComplete="off"
          name={`${recordId}-${field}`}
          className="w-full h-auto border data-focus:outline-0 data-focus:border-0 overflow-hidden resize-none"
          value={tempValue}
          onChange={(e) => {
            setTempValue(e.target.value);
            handleHeightChange();
          }}
          onBlur={saveValue}
          onFocus={(e) => {
            e.target.select();
            setTimeout(() => {
              handleHeightChange();
            }, 100);
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && e.altKey) {
              e.stopPropagation();
              const ref = textareaRef.current;
              if (!ref) return;

              const start = ref.selectionStart;
              const end = ref.selectionEnd;

              const newValue = tempValue.slice(0, start) + "\n" + tempValue.slice(end);

              setTempValue(newValue);

              requestAnimationFrame(() => {
                if (!ref) return;
                ref.selectionStart = ref.selectionEnd = start + 1;
                handleHeightChange();
              });
            }
          }}
        />
      ) : (
        <>{value ?? ""}</>
      )}
    </div>
  );
}
