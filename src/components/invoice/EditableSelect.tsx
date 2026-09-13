"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { toast } from "sonner";

import { useInvoiceEdit } from "@/utils/hooks/useInvoiceEdit";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";

interface EditableSelectProps {
  recordId: string;
  field: string;
  value: string | number | null;
  options: string[];
  user: User;
  className?: string;
  setInvoices: Dispatch<SetStateAction<Invoice[] | null>>;
  activeCell: { recordId: string; field: string } | null;
  setActiveCell: Dispatch<
    SetStateAction<{ recordId: string; field: string } | null>
  >;
  handleKeyNavigation: (key: "up" | "down" | "left" | "right") => void;
  registerCellRef: (
    id: string,
    field: string,
    el: HTMLDivElement | null
  ) => void;
}

type FinishMode = "save" | "cancel";

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
  const [tempValue, setTempValue] = useState<string | number>(value ?? "");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const editingRef = useRef(false);
  const finishingRef = useRef(false);

  const {
    lockedByOther,
    lockedUser,
    saving,
    handleEditStart,
    handleSave,
    handleUnlock,
  } = useInvoiceEdit({
    recordId,
    field,
    userId,
  });

  const isActive =
    activeCell?.recordId === recordId && activeCell?.field === field;

  const setContainerRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerCellRef(recordId, field, element);
    },
    [field, recordId, registerCellRef]
  );

  const updateInvoiceState = useCallback(
    (updatedInvoice: Invoice) => {
      setInvoices((prev) => {
        if (!prev) return prev;

        return prev.map((invoice) =>
          invoice.id === recordId ? updatedInvoice : invoice
        );
      });
    },
    [recordId, setInvoices]
  );

  const getSelectedIndex = useCallback(
    (targetValue: string | number | null) =>
      options.findIndex((option) => option === String(targetValue ?? "")),
    [options]
  );

  const startEditing = useCallback(async () => {
    if (editingRef.current || finishingRef.current || saving) {
      return;
    }

    if (lockedByOther) {
      toast.warning(`${lockedUser}さんが編集中です`, {
        id: `invoice-lock-${recordId}`,
      });
      return;
    }

    const success = await handleEditStart();

    if (!success) {
      toast.warning("他のユーザーが編集中です", {
        id: `invoice-lock-${recordId}`,
      });
      return;
    }

    const currentValue = value ?? "";

    setTempValue(currentValue);
    setSelectedIndex(getSelectedIndex(currentValue));

    editingRef.current = true;
    setEditing(true);

    requestAnimationFrame(() => {
      buttonRef.current?.click();
    });
  }, [
    getSelectedIndex,
    handleEditStart,
    lockedByOther,
    lockedUser,
    recordId,
    saving,
    value,
  ]);

  const saveValue = useCallback(
    async (newValue: string | number): Promise<boolean> => {
      const result = await handleSave(newValue, value ?? "");

      if (!result.success || !result.invoice) {
        toast.error("保存に失敗しました");
        return false;
      }

      updateInvoiceState(result.invoice);
      return true;
    },
    [handleSave, updateInvoiceState, value]
  );

  const finishEditing = useCallback(
    async (
      mode: FinishMode,
      nextValue?: string | number
    ): Promise<boolean> => {
      if (finishingRef.current || !editingRef.current) {
        return false;
      }

      finishingRef.current = true;

      try {
        if (mode === "cancel") {
          const currentValue = value ?? "";

          editingRef.current = false;
          setEditing(false);
          setTempValue(currentValue);
          setSelectedIndex(getSelectedIndex(currentValue));

          return true;
        }

        const saveTarget = nextValue ?? tempValue;
        const success = await saveValue(saveTarget);

        if (!success) {
          return false;
        }

        editingRef.current = false;
        setEditing(false);
        setTempValue(saveTarget);
        setSelectedIndex(getSelectedIndex(saveTarget));

        return true;
      } finally {
        if (!editingRef.current) {
          await handleUnlock();
        }

        finishingRef.current = false;
      }
    },
    [getSelectedIndex, handleUnlock, saveValue, tempValue, value]
  );

  useLayoutEffect(() => {
    if (!editing) return;

    const frame = requestAnimationFrame(() => {
      listRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [editing]);

  const handleKeyDown = async (event: React.KeyboardEvent) => {
    if (editingRef.current) return;

    if (event.key === "Enter") {
      event.preventDefault();
      await startEditing();
      return;
    }

    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(
        event.key
      )
    ) {
      event.preventDefault();

      const map = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        Tab: event.shiftKey ? "left" : "right",
      } as const;

      handleKeyNavigation(map[event.key as keyof typeof map]);
    }
  };

  const handleListKeyDown = async (
    event: React.KeyboardEvent<HTMLUListElement>,
    close: () => void
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      const nextIndex = Math.min(
        options.length - 1,
        selectedIndex + 1
      );

      setSelectedIndex(nextIndex);

      listRef.current?.children[nextIndex]?.scrollIntoView({
        block: "nearest",
      });

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      const nextIndex = Math.max(0, selectedIndex - 1);

      setSelectedIndex(nextIndex);

      listRef.current?.children[nextIndex]?.scrollIntoView({
        block: "nearest",
      });

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const selectedValue =
        options[selectedIndex] ?? tempValue;

      const success = await finishEditing("save", selectedValue);

      if (success) {
        close();
        handleKeyNavigation(event.shiftKey ? "up" : "down");
      }

      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();

      const selectedValue =
        options[selectedIndex] ?? tempValue;

      const success = await finishEditing("save", selectedValue);

      if (success) {
        close();
        handleKeyNavigation(event.shiftKey ? "left" : "right");
      }

      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();

      const success = await finishEditing("save", "");

      if (success) {
        close();
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      await finishEditing("cancel");
      close();
    }
  };

  return (
    <div
      data-record-id={recordId}
      data-field={field}
      ref={setContainerRef}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => {
        void startEditing();
      }}
      onClick={(event) => {
        event.stopPropagation();
        setActiveCell({ recordId, field });
      }}
      className={`
        relative border-neutral-700 min-h-8 outline-none h-full flex items-center
        ${className ?? ""}
        ${isActive
          ? "bg-blue-300/50 dark:bg-blue-900/50 outline-2 -outline-offset-2 outline-blue-500 dark:outline-blue-700"
          : ""
        }
      `}
    >
      {editing ? (
        <Popover className="w-full h-full">
          {({ open, close }) => (
            <>
              <PopoverButton
                ref={buttonRef}
                autoFocus
                className="w-full h-full text-left py-1.5 px-2 bg-blue-300/30 dark:bg-blue-800/40 border border-blue-300 dark:border-blue-400 focus:outline-none"
              >
                {(options[selectedIndex] ?? tempValue) || "選択..."}
              </PopoverButton>

              {open && (
                <PopoverPanel
                  anchor="bottom start"
                  onMouseDown={(event) => event.stopPropagation()}
                  className="absolute z-10 mt-1 min-w-30 w-fit bg-white border border-gray-300 rounded-md shadow-md"
                >
                  <ul
                    ref={listRef}
                    tabIndex={0}
                    className="max-h-50 overflow-y-auto focus:outline-none"
                    onKeyDown={(event) => {
                      void handleListKeyDown(event, close);
                    }}
                  >
                    {options.map((option, index) => (
                      <li
                        key={option}
                        className={`px-3 py-2 cursor-pointer text-black ${index === selectedIndex
                            ? "bg-blue-200 font-semibold"
                            : "hover:bg-blue-50"
                          }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => {
                          void (async () => {
                            const success = await finishEditing(
                              "save",
                              option
                            );

                            if (success) {
                              close();
                            }
                          })();
                        }}
                      >
                        {option}
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
          {value === "" || value === null ? "-" : value}
          {field === "degree" && value !== "" && value !== null && "%"}
        </span>
      )}
    </div>
  );
}
