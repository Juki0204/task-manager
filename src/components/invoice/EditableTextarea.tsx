"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Textarea } from "@headlessui/react";
import { toast } from "sonner";

import { useInvoiceEdit } from "@/utils/hooks/useInvoiceEdit";
import { Invoice } from "@/utils/types/invoice";
import { User } from "@/utils/types/user";

interface EditableTextareaProps {
  recordId: string;
  field: string;
  value: string | null;
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

export default function EditableTextarea({
  recordId,
  field,
  value,
  user,
  className,
  setInvoices,
  activeCell,
  setActiveCell,
  handleKeyNavigation,
  registerCellRef,
}: EditableTextareaProps) {
  const userId = user.id;

  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value ?? "");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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

  const adjustHeight = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

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

    requestAnimationFrame(() => {
      const element = textareaRef.current;
      if (!element) return;

      element.focus();
      element.select();
      adjustHeight();
    });
  }, [
    adjustHeight,
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

  const handleContainerKeyDown = async (
    event: React.KeyboardEvent
  ) => {
    if (event.nativeEvent.isComposing || editingRef.current) {
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

  const handleTextareaKeyDown = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Enter" && event.altKey) {
      event.preventDefault();
      event.stopPropagation();

      const element = textareaRef.current;
      if (!element) return;

      const start = element.selectionStart;
      const end = element.selectionEnd;

      const nextValue =
        tempValue.slice(0, start) + "\n" + tempValue.slice(end);

      setTempValue(nextValue);

      requestAnimationFrame(() => {
        const currentElement = textareaRef.current;
        if (!currentElement) return;

        currentElement.selectionStart = start + 1;
        currentElement.selectionEnd = start + 1;
        adjustHeight();
      });

      return;
    }

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
      setActiveCell({ recordId, field });
    }
  };

  useEffect(() => {
    if (editingRef.current) return;
    setTempValue(value ?? "");
  }, [value]);

  useEffect(() => {
    if (!editing) return;

    const frame = requestAnimationFrame(adjustHeight);

    return () => cancelAnimationFrame(frame);
  }, [adjustHeight, editing]);

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
      onKeyDown={handleContainerKeyDown}
      className={`
        relative border-neutral-700 py-1.5 px-2 min-h-8 w-full h-full whitespace-pre-wrap
        ${className ?? ""}
        ${isActive
          ? "bg-blue-300/50 dark:bg-blue-900/50 outline -outline-offset-1 outline-blue-500 dark:outline-blue-700"
          : ""
        }
        ${editing
          ? "bg-blue-300/30 dark:!bg-blue-800/40 !outline-blue-300 dark:!outline-blue-400"
          : ""
        }
      `}
    >
      {editing ? (
        <Textarea
          ref={textareaRef}
          rows={1}
          autoFocus
          autoComplete="off"
          name={`${recordId}-${field}`}
          className="w-full h-auto border data-focus:outline-0 data-focus:border-0 overflow-hidden resize-none bg-transparent"
          value={tempValue}
          onChange={(event) => {
            setTempValue(event.target.value);
            requestAnimationFrame(adjustHeight);
          }}
          onBlur={() => {
            void finishEditing("save");
          }}
          onFocus={(event) => {
            event.target.select();
            requestAnimationFrame(adjustHeight);
          }}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={handleTextareaKeyDown}
          disabled={saving}
        />
      ) : (
        <>{value ?? ""}</>
      )}
    </div>
  );
}
