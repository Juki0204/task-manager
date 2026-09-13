"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";
import { Input } from "@headlessui/react";
import { toast } from "sonner";

import { useInvoiceEdit } from "@/utils/hooks/useInvoiceEdit";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";

interface EditableCellProps {
  recordId: string;
  field: string;
  value: string | number | null;
  user: User;
  className?: string;
  type?: string;
  pattern?: string;
  inputMode?:
  | "search"
  | "text"
  | "none"
  | "email"
  | "tel"
  | "url"
  | "numeric"
  | "decimal"
  | undefined;
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

export default function EditableCell({
  recordId,
  field,
  value,
  user,
  className,
  type,
  pattern,
  inputMode,
  setInvoices,
  activeCell,
  setActiveCell,
  handleKeyNavigation,
  registerCellRef,
}: EditableCellProps) {
  const userId = user.id;

  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string | number>(value ?? "");

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

    setTempValue(value ?? "");
    editingRef.current = true;
    setEditing(true);
  }, [
    handleEditStart,
    lockedByOther,
    lockedUser,
    recordId,
    saving,
    value,
  ]);

  const saveValue = useCallback(async (): Promise<boolean> => {
    const result = await handleSave(tempValue, value ?? "");

    if (!result.success || !result.invoice) {
      toast.error("保存に失敗しました");
      return false;
    }

    updateInvoiceState(result.invoice);

    if (result.changed && field === "title") {
      toast.success(`${result.invoice.serial}の作業タイトルを変更しました`);
    } else if (result.changed && field === "description") {
      toast.success(`${result.invoice.serial}の作業内容を変更しました`);
    }

    return true;
  }, [field, handleSave, tempValue, updateInvoiceState, value]);

  const finishEditing = useCallback(
    async (mode: FinishMode): Promise<boolean> => {
      if (finishingRef.current || !editingRef.current) {
        return false;
      }

      finishingRef.current = true;

      try {
        if (mode === "cancel") {
          editingRef.current = false;
          setEditing(false);
          setTempValue(value ?? "");
          return true;
        }

        const success = await saveValue();

        if (!success) {
          return false;
        }

        editingRef.current = false;
        setEditing(false);
        return true;
      } finally {
        if (!editingRef.current) {
          await handleUnlock();
        }

        finishingRef.current = false;
      }
    },
    [handleUnlock, saveValue, value]
  );

  const handleKeyDown = async (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (editingRef.current) {
      if (event.key === "Enter") {
        event.preventDefault();

        const success = await finishEditing("save");

        if (success) {
          handleKeyNavigation(event.shiftKey ? "up" : "down");
        }

        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();

        const success = await finishEditing("save");

        if (success) {
          handleKeyNavigation(event.shiftKey ? "left" : "right");
        }

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        await finishEditing("cancel");
      }

      return;
    }

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    if (type === "tel" || type === "number") {
      if (nextValue === "" || /^-?\d*$/.test(nextValue)) {
        setTempValue(nextValue);
      }
      return;
    }

    setTempValue(nextValue);
  };

  return (
    <div
      data-record-id={recordId}
      data-field={field}
      ref={setContainerRef}
      tabIndex={isActive ? 0 : -1}
      onDoubleClick={() => {
        void startEditing();
      }}
      onClick={(event) => {
        event.stopPropagation();
        setActiveCell({ recordId, field });
      }}
      onKeyDown={handleKeyDown}
      className={`
        relative border-neutral-700 py-1.5 px-2 min-h-8 h-full flex items-center
        ${className ?? ""}
        ${isActive
          ? "bg-blue-300/50 dark:bg-blue-900/50 outline -outline-offset-1 outline-blue-500 dark:outline-blue-700"
          : ""
        }
        ${editing
          ? "bg-blue-300/30 dark:!bg-blue-800/40 !outline-blue-300 dark:!outline-blue-400"
          : ""
        }
        ${typeof value === "number" && value < 0 ? "text-red-400" : ""
        }
      `}
    >
      {editing ? (
        <Input
          autoFocus
          autoComplete="off"
          name={`${recordId}-${field}`}
          className={`w-full h-full border data-focus:outline-0 data-focus:border-0 ${type === "tel" ? "text-right" : ""
            }`}
          type={type ?? "text"}
          value={tempValue}
          onChange={handleChange}
          onBlur={() => {
            void finishEditing("save");
          }}
          onFocus={(event) => event.target.select()}
          onClick={(event) => event.stopPropagation()}
          max={type === "date" ? "9999-12-31" : undefined}
          pattern={pattern}
          inputMode={inputMode}
          disabled={saving}
        />
      ) : (
        <>{value ?? ""}</>
      )}
    </div>
  );
}
