"use client";

import { useCellEdit } from "@/utils/hooks/useCellEdit";
import { supabase } from "@/utils/supabase/supabase";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";
import { Input } from "@headlessui/react";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";

interface EditableCellProps {
  recordId: string;
  field: string;
  value: string | number;
  user: User;
  className?: string;
  type?: string;
  setInvoices: Dispatch<SetStateAction<Invoice[] | null>>;
  activeCell: { recordId: string; field: string; } | null;
  setActiveCell: Dispatch<SetStateAction<{ recordId: string, field: string } | null>>;
}

export default function EditableCell({
  recordId,
  field,
  value,
  user,
  className,
  type,
  setInvoices,
  activeCell,
  setActiveCell
}: EditableCellProps) {
  const userId = user.id;
  const [editing, setEditing] = useState<boolean>(false);
  const [tempValue, setTempValue] = useState<string | number>(value);
  const { lockedByOther, lockedUser, handleEditStart, handleSave } = useCellEdit({ recordId, field, userId });

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
      toast.success(`${user.name}さんが${task.serial}の作業タイトルを変更しました`);
    } else if (field === "desctiption" && tempValue !== value) {
      toast.success(`${user.name}さんが${task.serial}の作業内容を変更しました`);
    }
  }

  return (
    <div
      onDoubleClick={startEditing}
      onClick={(e) => { e.stopPropagation(); setActiveCell({ recordId, field }); }}
      className={`border-neutral-700 p-2 min-h-9 ${className}
        ${editing || activeCell?.recordId === recordId && activeCell?.field === field
          ? "bg-blue-900/50 outline-2 -outline-offset-2 outline-blue-700"
          : ""
        }`}
    >
      {lockedByOther && (<div className="editing-cell"><span className="editing-cell-text">{lockedUser}さんが編集中...</span></div>)}
      {editing ? (
        <Input
          autoFocus
          className={`w-full border border-blue-400 data-focus:outline-0 data-focus:border-0 ${type === "tel" ? "text-right" : ""}`}
          type={type ?? "text"}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={saveValue}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveValue();
          }}
        />
      ) : (
        <>{value === "" ? (field === "remarks" ? "" : "") : value}</>
      )}
    </div>
  );
}