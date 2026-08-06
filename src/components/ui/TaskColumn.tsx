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
  onClick: (t: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
  titleStyle: string;
  currentClickTask: string | null;
  onEdit: (t: Task) => void;
  draggingTaskId: string | null;
  draggingTaskPrevIndex: number | null;
  flyAnimationRef: React.RefObject<((taskId: string) => void) | null>;
  lastDropRef: React.RefObject<{ x: number, y: number } | null>;
  deadlineList: { task_id: string, date: string }[];
}

export function TaskColumn({
  id,
  title,
  tasks,
  user,
  onClick,
  onContextMenu,
  titleStyle,
  currentClickTask,
  onEdit,
  draggingTaskId,
  draggingTaskPrevIndex,
  flyAnimationRef,
  lastDropRef,
  deadlineList,
}: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="flex flex-col min-h-[calc(100vh-9.5rem)] min-w-90">
      <h2 className={`font-bold p-2 text-center ${titleStyle}`}>{title}</h2>

      <div className={`p-0.5 h-full ${titleStyle}`}>
        <div className="p-1.5 bg-neutral-100 flex flex-col gap-1 h-full">
          {tasks.map((task, index) => (
            <PersonalCard
              user={user}
              key={task.id}
              data={{ containerId: id }}
              task={task}
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
              deadlineList={deadlineList}
            />
          ))}
        </div>
      </div>
    </div>
  )
}