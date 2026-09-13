"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Tooltip } from "react-tooltip";
import { toast } from "sonner";

import { useInvoiceEdit } from "@/utils/hooks/useInvoiceEdit";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";

interface EditableComboboxProps {
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
}: EditableComboboxProps) {
  const userId = user.id;

  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(String(value ?? ""));
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isInvalid, setIsInvalid] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
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

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery === "") return options;

    return options.filter((option) =>
      option.toLowerCase().includes(normalizedQuery)
    );
  }, [options, query]);

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

  const getOptionIndex = useCallback(
    (targetValue: string) =>
      options.findIndex((option) => option === targetValue),
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

    const currentValue = String(value ?? "");

    setTempValue(currentValue);
    setQuery("");
    setSelectedIndex(getOptionIndex(currentValue));
    setIsInvalid(false);

    editingRef.current = true;
    setEditing(true);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [
    getOptionIndex,
    handleEditStart,
    lockedByOther,
    lockedUser,
    recordId,
    saving,
    value,
  ]);

  const validateValue = useCallback(
    (targetValue: string) => {
      const trimmed = targetValue.trim();
      return trimmed === "" || options.includes(trimmed);
    },
    [options]
  );

  const saveValue = useCallback(
    async (newValue: string): Promise<boolean> => {
      const normalizedValue = newValue.trim();

      if (!validateValue(normalizedValue)) {
        setIsInvalid(true);
        window.setTimeout(() => setIsInvalid(false), 1500);
        return false;
      }

      const result = await handleSave(normalizedValue, String(value ?? ""));

      if (!result.success || !result.invoice) {
        toast.error("保存に失敗しました");
        return false;
      }

      updateInvoiceState(result.invoice);
      return true;
    },
    [handleSave, updateInvoiceState, validateValue, value]
  );

  const finishEditing = useCallback(
    async (
      mode: FinishMode,
      nextValue?: string
    ): Promise<boolean> => {
      if (finishingRef.current || !editingRef.current) {
        return false;
      }

      finishingRef.current = true;

      try {
        if (mode === "cancel") {
          const currentValue = String(value ?? "");

          editingRef.current = false;
          setEditing(false);
          setTempValue(currentValue);
          setQuery("");
          setSelectedIndex(getOptionIndex(currentValue));
          setIsInvalid(false);

          return true;
        }

        const saveTarget = (nextValue ?? tempValue).trim();

        if (!validateValue(saveTarget)) {
          setIsInvalid(true);
          window.setTimeout(() => setIsInvalid(false), 1500);
          return false;
        }

        const success = await saveValue(saveTarget);

        if (!success) {
          return false;
        }

        editingRef.current = false;
        setEditing(false);
        setTempValue(saveTarget);
        setQuery("");
        setSelectedIndex(getOptionIndex(saveTarget));

        return true;
      } finally {
        if (!editingRef.current) {
          await handleUnlock();
        }

        finishingRef.current = false;
      }
    },
    [getOptionIndex, handleUnlock, saveValue, tempValue, validateValue, value]
  );

  useLayoutEffect(() => {
    if (!editing) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [editing]);

  useEffect(() => {
    if (!editing || !listRef.current || selectedIndex < 0) return;

    const selectedElement = listRef.current.children[
      selectedIndex
    ] as HTMLElement | undefined;

    selectedElement?.scrollIntoView({ block: "nearest" });
  }, [editing, selectedIndex]);

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

  const handleInputKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (filteredOptions.length === 0) return;

      const nextIndex = Math.min(
        filteredOptions.length - 1,
        selectedIndex + 1
      );

      setSelectedIndex(nextIndex);
      setTempValue(filteredOptions[nextIndex] ?? tempValue);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (filteredOptions.length === 0) return;

      const nextIndex = Math.max(0, selectedIndex - 1);

      setSelectedIndex(nextIndex);
      setTempValue(filteredOptions[nextIndex] ?? tempValue);
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();

      const success = await finishEditing("save", tempValue);

      if (!success) return;

      if (event.key === "Enter") {
        handleKeyNavigation(event.shiftKey ? "up" : "down");
      } else {
        handleKeyNavigation(event.shiftKey ? "left" : "right");
      }

      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();

      const success = await finishEditing("save", "");

      if (success) {
        setActiveCell({ recordId, field });
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      await finishEditing("cancel");
      setActiveCell({ recordId, field });
    }
  };

  return (
    <div
      data-record-id={recordId}
      data-field={field}
      ref={setContainerRef}
      tabIndex={isActive && !editing ? 0 : -1}
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
        <Combobox
          value={tempValue}
          onChange={(selectedValue) => {
            if (selectedValue !== null) {
              setTempValue(String(selectedValue));
            }
          }}
        >
          <ComboboxInput
            id={`input-${recordId}-${field}`}
            ref={inputRef}
            autoFocus
            autoComplete="off"
            name={`${recordId}-${field}`}
            className="w-full h-full text-left py-1.5 px-2 bg-blue-300/30 dark:bg-blue-800/40 border border-blue-300 dark:border-blue-400 focus:outline-none"
            displayValue={(selectedValue: string) => selectedValue ?? ""}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              const nextValue = event.target.value;

              setQuery(nextValue);
              setTempValue(nextValue);
              setSelectedIndex(
                nextValue.trim() === ""
                  ? getOptionIndex(String(value ?? ""))
                  : 0
              );
              setIsInvalid(false);
            }}
            onKeyDown={handleInputKeyDown}
            disabled={saving}
          />

          {isInvalid && (
            <Tooltip
              anchorSelect={`#input-${recordId}-${field}`}
              place="top"
              className="!bg-red-500 !text-white !text-sm !py-1 !px-2 !rounded-md z-50 animate-shake"
              isOpen
            >
              無効な値です
            </Tooltip>
          )}

          <ComboboxOptions
            ref={listRef}
            static
            anchor="bottom start"
            className="absolute z-10 mt-1 !max-h-90 !w-70 text-sm bg-white tracking-wider border border-gray-300 rounded-md shadow-md overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <ComboboxOption
                  key={option}
                  value={option}
                  className={`px-3 py-2 cursor-pointer text-black ${value === option ? "bg-blue-50 font-semibold" : ""
                    } ${index === selectedIndex
                      ? "bg-blue-100"
                      : "hover:bg-blue-100"
                    }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    void finishEditing("save", option);
                  }}
                >
                  {option}
                </ComboboxOption>
              ))
            ) : (
              <p className="px-3 py-2 text-neutral-600">候補がありません</p>
            )}
          </ComboboxOptions>
        </Combobox>
      ) : (
        <span className="p-2 block overflow-hidden">
          {value === "" || value === null ? "-" : value}
          {field === "degree" && value !== "" && value !== null && "%"}
        </span>
      )}
    </div>
  );
}
