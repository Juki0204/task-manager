import { MouseEvent, useEffect, useRef, useState } from "react";
import { ChangeInterrupt, ChangeInProgress, ChangeNotYetStarted, ChangeRemove, ChangeConfirm, ChangeComplete, DeleteTaskBtn, CopyTaskBtn, UpdateTaskBtn } from "./ContextMenuBtn";
import { Task } from "@/utils/types/task";
import { useTask } from "../providers/TaskProvider";

type ContextMenuProps = {
  x: number;
  y: number;
  taskId: string;
  taskSerial: string;
  onClose: () => void;
  updateTaskStatus: (taskId: string, newStatus: string, prevStatus: string, extraFields?: Partial<Task>) => Promise<void>;
  onCopyTask?: (t: Task) => void;
};

export default function ContextMenu({ x, y, taskId, taskSerial, onClose, updateTaskStatus, onCopyTask }: ContextMenuProps) {
  const { openEdit } = useTask();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: y, left: x });

  useEffect(() => {
    if (!menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let newLeft = x + 10;
    let newTop = y + 10;

    //右端判定
    if (x + menuRect.width > window.scrollX + winW) {
      newLeft = x - menuRect.width - 10;
    }

    //下端判定
    if (y + menuRect.height > window.scrollY + winH) {
      newTop = y - menuRect.height - 10;
    }

    //console.log(newTop, newLeft);

    setPos({ top: newTop, left: newLeft });
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-60 rounded bg-neutral-100/95 dark:bg-neutral-800/95 shadow-neutral-900/30 dark:shadow-neutral-900 shadow-xl p-2"
      style={{ top: pos.top, left: pos.left }}
      onClick={(e: MouseEvent) => e.stopPropagation()}
    >
      <h2 className="rounded-md text-center p-1 mb-2 text-sm">{taskSerial}</h2>

      <div className="flex gap-0.5 border-b border-neutral-300 dark:border-neutral-700 pb-1 mb-1">
        <UpdateTaskBtn taskId={taskId} onClick={onClose} onEdit={(t: Task) => openEdit(t)} />
        {onCopyTask && (
          <CopyTaskBtn taskId={taskId} onClick={onClose} onCopyTask={(t) => onCopyTask(t)} />
        )}
        <DeleteTaskBtn taskId={taskId} taskSerial={taskSerial} onClick={onClose} updateTaskStatus={updateTaskStatus} />
      </div>

      <div className="flex flex-col gap-0.5 border-b border-neutral-300 dark:border-neutral-700 pb-1 mb-1">
        <ChangeInProgress taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
        <ChangeInterrupt taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
        <ChangeConfirm taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
        <ChangeComplete taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
        <ChangeNotYetStarted taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
      </div>

      <div className="flex flex-col gap-0.5">
        <ChangeRemove taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
      </div>

    </div>
  );
}