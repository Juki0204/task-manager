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
import { Tooltip } from "react-tooltip";

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
  const [isInvalid, setIsInvalid] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { lockedByOther, lockedUser, handleEditStart, handleSave, handleCancel } = useCellEdit({
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
    if (ok) setEditing(true);
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
      // const list = listRef.current;
      const target = e.target as HTMLElement;

      if (el && el.contains(target)) return;
      if (target?.closest('[role="listbox"]')) return;
      setEditing(false);
      setTempValue(String(value));
    };
    if (editing) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);


  // 選択中アイテムをスクロール範囲内に維持
  useEffect(() => {
    if (editing && listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (selectedEl) selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, editing]);


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
      data-record-id={recordId}
      data-field={field}
      ref={containerRef}
      tabIndex={isActive && !editing ? 0 : -1}
      onKeyDown={handleKeyDown}
      onDoubleClick={startEditing}
      onClick={(e) => {
        e.stopPropagation();
        setActiveCell({ recordId, field });
      }}
      className={`relative border-neutral-700 min-h-8 outline-none
        ${className}
        ${isActive ? "bg-blue-900/50 outline-2 -outline-offset-2 outline-blue-700" : ""}
        h-full flex items-center
      `}
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
            setTempValue(val ?? "");
          }}
        >
          <ComboboxInput
            id={`input-${recordId}-${field}`}
            ref={inputRef}
            autoFocus
            autoComplete="off"
            name={`${recordId}-${field}`}
            className="w-full h-full text-left py-1.5 px-2 bg-blue-800/40 border border-blue-400 focus:outline-none"
            displayValue={(val: string) => val ?? ""}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              setQuery(e.target.value);
              setTempValue(e.target.value);
              setSelectedIndex(0);
              setIsInvalid(false);
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return; //変換中は処理しない

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => {
                  const next = Math.min(filteredOptions.length - 1, prev + 1);
                  setTempValue(filteredOptions[next] ?? tempValue);
                  return next;
                });
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => {
                  const next = Math.max(0, prev - 1);
                  setTempValue(filteredOptions[next] ?? tempValue);
                  return next;
                });
              } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                const inputValue = tempValue.trim();
                const isEmpty = inputValue === "";
                const isValid = filteredOptions.includes(inputValue);
                if (!isValid && !isEmpty) {
                  setIsInvalid(true);
                  setTimeout(() => setIsInvalid(false), 1500);
                  return;
                }
                saveValue(inputValue);
                handleCancel();

                if (e.key === "Enter") {
                  handleKeyNavigation(e.shiftKey ? "up" : "down");
                } else {
                  handleKeyNavigation(e.shiftKey ? "left" : "right");
                }
              } else if (e.key === "Delete") {
                e.preventDefault();
                setEditing(false);
                saveValue("");
                handleCancel();
                setActiveCell({ recordId, field }); //アクティブセルがリセットされるのを防ぐ
              } else if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
                handleCancel();
                setTempValue(String(value));
                setActiveCell({ recordId, field }); //アクティブセルがリセットされるのを防ぐ
              }
            }}
          />


          {isInvalid && (
            <Tooltip
              anchorSelect={`#input-${recordId}-${field}`}
              place="top"
              className="!bg-red-500 !text-white !text-sm !py-1 !px-2 !rounded-md x-50 animate-shake"
              isOpen
            >
              無効な値です
            </Tooltip>
          )}

          <ComboboxOptions
            ref={listRef}
            static
            anchor="bottom start"
            className="absolute z-10 mt-1 !max-h-90 !w-70 text-sm bg-white tracking-wider border border-gray-300 rounded-md shadow-md overflow-y-auto
              [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <ComboboxOption
                  key={opt}
                  value={opt}
                  className={`px-3 py-2 cursor-pointer text-black 
                  ${value === opt ? "bg-blue-50 font-semibold" : ""}
                  ${index === selectedIndex
                      ? "bg-blue-100"
                      : "hover:bg-blue-100"
                    }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    saveValue(opt);
                    setEditing(false);
                  }}
                >
                  {opt}
                </ComboboxOption>
              ))
            ) : (
              <p className="px-3 py-2 cursor-pointer text-neutral-600">候補がありません</p>
            )
            }
          </ComboboxOptions>
        </Combobox>
      ) : (
        <span className="p-2 block overflow-hidden">
          {value === "" ? "-" : value}
          {field === "degree" && value && "%"}
        </span>
      )}
    </div>
  );
}
