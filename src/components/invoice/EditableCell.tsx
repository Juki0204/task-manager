"use client";

import { useCellEdit } from "@/utils/hooks/useCellEdit";
import { supabase } from "@/utils/supabase/supabase";
import { User } from "@/utils/types/user";
import { Input } from "@headlessui/react";
import { useState } from "react";
import { toast } from "sonner";

interface EditableCellProps {
  recordId: string;
  field: string;
  value: string | number;
  user: User;
  className?: string;
  type?: string;
}

export default function EditableCell({ recordId, field, value, user, className, type }: EditableCellProps) {
  const userId = user.id;
  const [editing, setEditing] = useState<boolean>(false);
  const [tempValue, setTempValue] = useState<string | number>(value);
  const { lockedByOther, lockedUser, handleEditStart, handleSave } = useCellEdit({ recordId, field, userId });

  async function startEditing() {
    const ok = await handleEditStart();
    if (ok) setEditing(true);
  }

  async function saveValue() {
    setEditing(false);
    await handleSave(tempValue, value);
    const { data: task } = await supabase
      .from("invoice")
      .select("*")
      .eq("id", recordId)
      .single();
    if (field === "title") {
      toast.success(`${user.name}さんが${task.serial}の作業タイトルを変更しました`);
    } else if (field === "desctiption") {
      toast.success(`${user.name}さんが${task.serial}の作業内容を変更しました`);
    }
  }

  return (
    <div
      onDoubleClick={startEditing}
      className={`border-neutral-700 p-2 ${className} ${editing
        ? "bg-blue-900/50 outline-2 -outline-offset-2 outline-blue-700"
        : "bg-neutral-900 hover:bg-neutral-800"
        }`}
    >
      {lockedByOther && (<div className="editing-cell"><span className="editing-cell-text">{lockedUser}さんが編集中...</span></div>)}
      {editing ? (
        <Input
          autoFocus
          className="w-full border border-blue-400 data-focus:outline-0 data-focus:border-0"
          type={type ?? "text"}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={saveValue}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveValue();
          }}
        />
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}