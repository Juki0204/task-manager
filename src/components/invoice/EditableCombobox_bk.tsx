"use client";

import { useCellEdit } from "@/utils/hooks/useCellEdit";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface EditableSelectProps {
  recordId: string;
  field: string;
  value: string | number;
  options: string[];
  user: User;
  className?: string;
  setInvoices: Dispatch<SetStateAction<Invoice[] | null>>;
  activeCell: { recordId: string; field: string } | null;
  setActiveCell: Dispatch<SetStateAction<{ recordId: string; field: string } | null>>;
  handleKeyNavigation: (key: "up" | "down" | "left" | "right") => void;
  registerCellRef: (id: string, field: string, el: HTMLDivElement | null) => void;
}

export default function EditableCombobox({
  recordId,
  field,
  value,
  options,
  user,
  className,
  setInvoices,
  activeCell,
  setActiveCell,
  handleKeyNavigation,
  registerCellRef,
}: EditableSelectProps) {
  const userId = user.id;
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string>(String(value));
  const [query, setQuery] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { lockedByOther, lockedUser, handleEditStart, handleSave } = useCellEdit({
    recordId,
    field,
    userId,
  });

  const isActive = activeCell?.recordId === recordId && activeCell?.field === field;

  useLayoutEffect(() => {
    registerCellRef(recordId, field, containerRef.current);
    return () => registerCellRef(recordId, field, null);
  }, [recordId, field, registerCellRef]);

  const filteredOptions = query.trim() === ""
    ? options
    : options.filter((opt) => opt.toLowerCase().includes(query.toLowerCase()));

  async function startEditing() {
    const ok = await handleEditStart();
    if (!ok) return;
    setEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      setTimeout(() => inputRef.current?.focus(), 10);
    });
  }

  async function saveValue(newValue: string) {
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


  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!editing) return;
      const el = containerRef.current;
      if (el && el.contains(e.target as Node)) return;
      setEditing(false);
    };
    if (editing) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return;
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
  };


  return (
    <div
      ref={containerRef}
      tabIndex={isActive && !editing ? 0 : -1}
      onKeyDown={handleKeyDown}
      onDoubleClick={startEditing}
      onClick={(e) => {
        e.stopPropagation();
        setActiveCell({ recordId, field });
      }}
      className={`relative border-neutral-700 min-h-9 outline-none
        ${className} ${isActive ? "bg-blue-900/50 outline-2 -outline-offset-2 outline-blue-700" : ""
        }`}
    >
      {lockedByOther && (
        <div className="editing-cell">
          <span className="editing-cell-text">{lockedUser}さんが編集中...</span>
        </div>
      )}

      {editing ? (
        <Combobox
          value={tempValue}
          onChange={(val) => {
            const formatVal = val ?? "";
            saveValue(formatVal);
          }}
        >
          <ComboboxInput
            ref={inputRef}
            autoFocus
            className="w-full text-left p-2 bg-blue-800/40 border border-blue-400 rounded-sm focus:outline-none"
            displayValue={(val: string) => val}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              setQuery(e.target.value);
              setTempValue(e.target.value);
              if (!editing) setEditing(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const chosen =
                  (filteredOptions.length > 0 ? filteredOptions[0] : tempValue) ?? "";
                saveValue(String(chosen));
                handleKeyNavigation("down");
              } else if (e.key === "Tab") {
                e.preventDefault();
                const chosen =
                  (filteredOptions.length > 0 ? filteredOptions[0] : tempValue) ?? "";
                saveValue(String(chosen));
                handleKeyNavigation(e.shiftKey ? "left" : "right");
              } else if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
              }
            }}
          />

          <ComboboxOptions
            static
            anchor="bottom start"
            className="absolute z-10 mt-1 !max-h-60 !w-80 bg-white border border-gray-300 rounded-md shadow-md overflow-y-auto
              [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400"
          >
            {filteredOptions.map((opt, index) => (
              <ComboboxOption
                key={opt}
                value={opt}
                className="px-3 py-2 cursor-pointer text-black hover:bg-blue-50 data-[focus]:bg-blue-100 data-[selected]:font-semibold data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  saveValue(opt);
                  setEditing(false);
                }}
              >
                {opt}
              </ComboboxOption>
            ))

            }
          </ComboboxOptions>
        </Combobox>
      ) : (
        <span className="p-2 block">
          {value === "" ? "-" : value}
          {field === "degree" && value && "%"}
        </span>
      )}
    </div>
  );
}
