import { MouseEvent } from "react";
import { ChangeInterrupt, ChangeInProgress, ChangeNotYetStarted, ChangeDelete } from "./ContextMenuBtn";

type ContextMenuProps = {
  x: number;
  y: number;
  taskId: string;
  taskSerial: string;
  onClose: () => void;
};

export default function ContextMenu({ x, y, taskId, taskSerial, onClose }: ContextMenuProps) {
  return (
    <div
      className="absolute z-50 w-48 rounded bg-slate-700 shadow-neutral-900 shadow-xl p-2"
      // style={{ top: y, left: x }}
      style={{ top: y + 10, left: x + 10 }}
      onClick={(e: MouseEvent) => e.stopPropagation()}
    >
      <h2 className="rounded-md text-center bg-neutral-200 p-1 mb-2 text-sm">{taskSerial ? taskSerial : "TEST-0001"}</h2>

      <h3 className="text-sm font-bold text-white py-1">■ 状態変更</h3>
      <ul className="flex flex-col gap-0.5 border-b border-slate-400 pb-1 mb-1">
        <ChangeNotYetStarted taskId={taskId} onClick={onClose}></ChangeNotYetStarted>
        <ChangeInProgress taskId={taskId} onClick={onClose}></ChangeInProgress>
        <ChangeInterrupt taskId={taskId} onClick={onClose}></ChangeInterrupt>
      </ul>

      <ul className="flex flex-col gap-0.5">
        <ChangeDelete taskId={taskId} taskSerial={taskSerial} onClick={onClose}></ChangeDelete>
      </ul>

    </div>
  );
}