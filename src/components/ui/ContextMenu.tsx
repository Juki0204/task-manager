import { MouseEvent, useEffect, useRef, useState } from "react";
import { ChangeInterrupt, ChangeInProgress, ChangeNotYetStarted, ChangeDelete, ChangeRemove, ChangeConfirm, InsertCopyTask } from "./ContextMenuBtn";
import { Task } from "@/utils/types/task";

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

    console.log(newTop, newLeft);

    setPos({ top: newTop, left: newLeft });
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-48 rounded bg-slate-700 shadow-neutral-900 shadow-xl p-2"
      style={{ top: pos.top, left: pos.left }}
      onClick={(e: MouseEvent) => e.stopPropagation()}
    >
      <h2 className="rounded-md text-center bg-neutral-200 p-1 mb-2 text-sm">{taskSerial}</h2>

      <h3 className="text-sm font-bold text-white py-1">■ 状態変更</h3>
      <ul className="flex flex-col gap-0.5 border-b border-slate-400 pb-1 mb-1">
        <ChangeInProgress taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
        <ChangeInterrupt taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
        <ChangeConfirm taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
        <ChangeNotYetStarted taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
        <ChangeRemove taskId={taskId} onClick={onClose} updateTaskStatus={updateTaskStatus} />
      </ul>

      <ul className="flex flex-col gap-0.5">
        {onCopyTask && (
          <InsertCopyTask taskId={taskId} onClick={onClose} onCopyTask={(t) => onCopyTask(t)} />
        )}

        <ChangeDelete taskId={taskId} taskSerial={taskSerial} onClick={onClose} updateTaskStatus={updateTaskStatus} />
      </ul>

    </div>
  );
}