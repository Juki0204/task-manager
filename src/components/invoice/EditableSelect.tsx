"use client";

import { useCellEdit } from "@/utils/hooks/useCellEdit";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

interface EditableCellProps {
  recordId: string;
  field: string;
  value: string | number;
  options: string[];
  user: User;
  className?: string;
  setInvoices: Dispatch<SetStateAction<Invoice[] | null>>;
}

export default function EditableSelect({
  recordId,
  field,
  value,
  options,
  user,
  className,
  setInvoices,
}: EditableCellProps) {
  const userId = user.id;
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string | number>(value);
  const { lockedByOther, lockedUser, handleEditStart, handleSave } = useCellEdit({
    recordId,
    field,
    userId,
  });

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  async function startEditing() {
    const ok = await handleEditStart();
    if (ok) {
      setEditing(true);
    }
  }

  async function saveValue(newValue: string | number) {
    setInvoices((prev) =>
      prev
        ? prev.map((inv) =>
          inv.id === recordId ? { ...inv, [field]: newValue } : inv
        )
        : prev
    );

    setTempValue(newValue);
    setEditing(false);
    await handleSave(newValue, value);
  }

  // 編集開始時にPopoverButtonを1回クリックして展開
  useEffect(() => {
    if (editing && buttonRef.current) {
      // setTimeoutを挟むことでマウント完了後に確実に発火
      setTimeout(() => {
        buttonRef.current?.click();
      }, 0);
    }
  }, [editing]);

  // 外部クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setEditing(false);
      }
    }
    if (editing) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editing]);

  return (
    <div
      ref={popoverRef}
      onDoubleClick={startEditing}
      className={`relative border-neutral-700 min-h-9 ${className} ${editing ? "bg-blue-900/50 outline-2 -outline-offset-2 outline-blue-700" : ""}`}
    >
      {lockedByOther && (
        <div className="editing-cell">
          <span className="editing-cell-text">{lockedUser}さんが編集中...</span>
        </div>
      )}

      {editing ? (
        <Popover>
          {({ open, close }) => (
            <>
              <PopoverButton
                ref={buttonRef}
                autoFocus
                className="w-full text-left p-2 bg-blue-800/40 border border-blue-400 rounded-sm focus:outline-none"
              >
                {tempValue || "選択..."}
              </PopoverButton>

              {open && (
                <PopoverPanel
                  anchor="bottom start"
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute z-10 mt-1 min-w-30 w-fit bg-white border border-gray-300 rounded-md shadow-md"
                >
                  <ul className="max-h-50 overflow-y-auto">
                    {options.map((opt) => (
                      <li
                        key={opt}
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-100 text-black ${tempValue === opt ? "bg-blue-50 font-semibold" : ""
                          }`}
                        onClick={() => {
                          saveValue(opt);
                          close();
                        }}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                </PopoverPanel>
              )}
            </>
          )}
        </Popover>
      ) : (
        <span className="p-2 block">
          {value === "" ? "-" : value}
          {field === "degree" && value && "%"}
        </span>
      )}
    </div>
  );
}
