"use client";

import { useCellEdit } from "@/utils/hooks/useCellEdit";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";
import { Select } from "@headlessui/react";
import { Dispatch, SetStateAction, useState } from "react";

interface EditableCellProps {
  recordId: string;
  field: string;
  value: string | number;
  options: string[];
  user: User;
  className?: string;
  setInvoices: Dispatch<SetStateAction<Invoice[] | null>>;
}

export default function EditableSelect({ recordId, field, value, options, user, className, setInvoices }: EditableCellProps) {
  const userId = user.id;
  const [editing, setEditing] = useState<boolean>(false);
  const [tempValue, setTempValue] = useState<string | number>(value);
  const { lockedByOther, lockedUser, handleEditStart, handleSave } = useCellEdit({ recordId, field, userId });

  async function startEditing() {
    const ok = await handleEditStart();
    if (ok) setEditing(true);
  }

  async function saveValue(newValue: string | number) {
    setInvoices((prev) =>
      prev
        ? prev.map((inv) =>
          inv.id === recordId ? { ...inv, [field]: newValue } : inv
        )
        : prev
    );

    setEditing(false);
    await handleSave(newValue, value);
  }

  return (
    <div
      onDoubleClick={startEditing}
      className={`border-neutral-700 min-h-9 ${className} ${editing
        ? "bg-blue-900/50 outline-2 -outline-offset-2 outline-blue-700"
        : ""
        }`}
    >
      {lockedByOther && (<div className="editing-cell"><span className="editing-cell-text">{lockedUser}さんが編集中...</span></div>)}
      {editing ? (
        <Select
          autoFocus
          className="w-full h-full p-1.75 border border-blue-400 data-focus:outline-0 data-focus:border-0"
          value={tempValue}
          onChange={(e) => {
            setTempValue(e.target.value)
            saveValue(e.target.value);
          }}
          onBlur={() => saveValue(tempValue)}
        >
          {options.map((opt) => (
            <option className="text-black" key={opt} value={opt}>{opt}</option>
          ))}
        </Select>
      ) : (
        <span className="p-2 block">{value === "" ? "-" : value}{field === "degree" && value && "%"}</span>
      )}
    </div>
  );
}