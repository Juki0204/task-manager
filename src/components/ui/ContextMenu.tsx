import { MouseEvent, useEffect, useRef, useState } from "react";
import { ChangeInterrupt, ChangeInProgress, ChangeNotYetStarted, ChangeDelete, ChangeRemove } from "./ContextMenuBtn";

type ContextMenuProps = {
  x: number;
  y: number;
  taskId: string;
  taskSerial: string;
  onClose: () => void;
};

export default function ContextMenu({ x, y, taskId, taskSerial, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top?: number; left?: number; right?: number; bottom?: number }>({});

  useEffect(() => {
    if (!menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let top: number | undefined = y + 10 + scrollY;
    let left: number | undefined = x + 10 + scrollX;
    let right: number | undefined;
    let bottom: number | undefined;

    //下端判定
    if (y + menuRect.height > winH) {
      top = undefined;
      bottom = 0;
    }

    //右端判定
    if (x + menuRect.width > winW) {
      left = undefined;
      right = 0;
    }

    setPos({ top, left, right, bottom });
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-48 rounded bg-slate-700 shadow-neutral-900 shadow-xl p-2"
      // style={{ top: y, left: x }}
      style={pos}
      onClick={(e: MouseEvent) => e.stopPropagation()}
    >
      <h2 className="rounded-md text-center bg-neutral-200 p-1 mb-2 text-sm">{taskSerial}</h2>

      <h3 className="text-sm font-bold text-white py-1">■ 状態変更</h3>
      <ul className="flex flex-col gap-0.5 border-b border-slate-400 pb-1 mb-1">
        <ChangeInProgress taskId={taskId} onClick={onClose}></ChangeInProgress>
        <ChangeInterrupt taskId={taskId} onClick={onClose}></ChangeInterrupt>
        <ChangeNotYetStarted taskId={taskId} onClick={onClose}></ChangeNotYetStarted>
        <ChangeRemove taskId={taskId} onClick={onClose}></ChangeRemove>
      </ul>

      <ul className="flex flex-col gap-0.5">
        <ChangeDelete taskId={taskId} taskSerial={taskSerial} onClick={onClose}></ChangeDelete>
      </ul>

    </div>
  );
}