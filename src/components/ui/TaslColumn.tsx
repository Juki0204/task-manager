"use client";

import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { Task } from "@/utils/types/task";
import Card from "../Card";
import PersonalCard from "../PersonalCard";

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  user: {
    id: string;
    name: string;
    email: string;
    employee: string;
  };
  onClick: (t: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
  className: string;
}

export function TaskColumn({ id, title, tasks, user, onClick, onContextMenu, className }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={className}>
      <h2 className="font-bold text-white pl-1">{title}</h2>

      {tasks.map(task => (
        <PersonalCard user={user} key={task.id} task={task} onClick={onClick} onContextMenu={onContextMenu}></PersonalCard>
      ))}
    </div>
  )
}