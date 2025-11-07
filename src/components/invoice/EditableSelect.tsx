"use client";

import { useCellEdit } from "@/utils/hooks/useCellEdit";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
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

export default function EditableSelect({
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
  const [tempValue, setTempValue] = useState<string | number>(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

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

  async function startEditing() {
    const ok = await handleEditStart();
    if (ok) {
      setEditing(true);
      setSelectedIndex(options.findIndex((o) => o === value));
      setTimeout(() => buttonRef.current?.click(), 10);
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

  // Popover開閉でフォーカス制御
  useLayoutEffect(() => {
    if (popoverOpen) setTimeout(() => listRef.current?.focus(), 0);
  }, [popoverOpen]);

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
      }
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

  // Popoverのopenを外側で安全に反映する
  const handlePopoverToggle = (isOpen: boolean) => {
    queueMicrotask(() => setPopoverOpen(isOpen));
  };

  return (
    <div
      data-record-id={recordId}
      data-field={field}
      ref={containerRef}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={handleKeyDown}
      onDoubleClick={startEditing}
      onClick={(e) => {
        e.stopPropagation();
        setActiveCell({ recordId, field });
      }}
      className={`relative border-neutral-700 min-h-9 outline-none ${className ?? ""} ${isActive ? "bg-blue-900/50 outline-2 -outline-offset-2 outline-blue-700" : ""
        }`}
    >
      {lockedByOther && (
        <div className="editing-cell">
          <span className="editing-cell-text">{lockedUser}さんが編集中...</span>
        </div>
      )}

      {editing ? (
        <Popover>
          {({ open, close }) => {
            handlePopoverToggle(open);

            return (
              <>
                <PopoverButton
                  ref={buttonRef}
                  autoFocus
                  className="w-full text-left p-2 bg-blue-800/40 border border-blue-400 focus:outline-none"
                >
                  {options[selectedIndex] ?? (tempValue || "選択...")}
                </PopoverButton>

                {open && (
                  <PopoverPanel
                    anchor="bottom start"
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute z-10 mt-1 min-w-30 w-fit bg-white border border-gray-300 rounded-md shadow-md"
                  >
                    <ul
                      ref={listRef}
                      tabIndex={0}
                      className="max-h-50 overflow-y-auto focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setSelectedIndex((prev) =>
                            Math.min(options.length - 1, prev + 1)
                          );
                          listRef.current?.children[
                            Math.min(options.length - 1, selectedIndex + 1)
                          ]?.scrollIntoView({ block: "nearest" });
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setSelectedIndex((prev) => Math.max(0, prev - 1));
                          listRef.current?.children[
                            Math.max(0, selectedIndex - 1)
                          ]?.scrollIntoView({ block: "nearest" });
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          const selectedValue = options[selectedIndex] ?? tempValue;
                          setEditing(false);
                          close();
                          requestAnimationFrame(() => {
                            saveValue(selectedValue);
                            handleKeyNavigation(e.shiftKey ? "up" : "down");
                          });
                        } else if (e.key === "Tab") {
                          e.preventDefault();
                          const selectedValue = options[selectedIndex] ?? tempValue;
                          setEditing(false);
                          close();
                          requestAnimationFrame(() => {
                            saveValue(selectedValue);
                            handleKeyNavigation(e.shiftKey ? "left" : "right");
                          });
                        } else if (e.key === "Delete") {
                          e.preventDefault();
                          saveValue("");
                          setEditing(false);
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          setEditing(false);
                          close();
                        }
                      }}
                    >
                      {options.map((opt, index) => (
                        <li
                          key={opt}
                          className={`px-3 py-2 cursor-pointer text-black ${index === selectedIndex
                            ? "bg-blue-200 font-semibold"
                            : "hover:bg-blue-50"
                            }`}
                          onMouseEnter={() => setSelectedIndex(index)}
                          onClick={() => {
                            setEditing(false);
                            close();
                            requestAnimationFrame(() => saveValue(opt));
                          }}
                        >
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </PopoverPanel>
                )}
              </>
            );
          }}
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
