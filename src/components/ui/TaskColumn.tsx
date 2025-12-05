"use client";

import { useDroppable } from "@dnd-kit/core";
import { Task } from "@/utils/types/task";
import PersonalCard from "../PersonalCard";
import { User } from "@/utils/types/user";

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  user: User;
  unreadIds: string[];
  onClick: (t: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
  className: string;
  currentClickTask: string | null;
  onEdit: (t: Task) => void;
  draggingTaskId: string | null;
  draggingTaskPrevIndex: number | null;
  flyAnimationRef: React.RefObject<((taskId: string) => void) | null>;
  lastDropRef: React.RefObject<{ x: number, y: number } | null>;
}

export function TaskColumn({
  id,
  title,
  tasks,
  user,
  unreadIds,
  onClick,
  onContextMenu,
  className,
  currentClickTask,
  onEdit,
  draggingTaskId,
  draggingTaskPrevIndex,
  flyAnimationRef,
  lastDropRef,
}: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={className}>
      <h2 className="font-bold text-white p-1 text-center">{title}</h2>

      {tasks.map((task, index) => (
        <PersonalCard
          user={user}
          key={task.id}
          data={{ containerId: id }}
          task={task}
          unreadIds={unreadIds}
          onClick={onClick}
          onContextMenu={onContextMenu}
          currentClickTask={currentClickTask}
          onEdit={onEdit}
          isDraggable={
            !task.manager || task.manager === user.name
          }
          draggingTaskId={draggingTaskId}
          draggingTaskPrevIndex={draggingTaskPrevIndex}
          index={index}
          flyAnimationRef={flyAnimationRef}
          lastDropRef={lastDropRef}
        />
      ))}
    </div>
  )
}