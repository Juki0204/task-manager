"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";
import AddTask from "@/components/AddTask";

import TaskList from "@/components/TaskList";

type taskListStyle = "rowListStyle" | "cardListStyle";

export default function Home() {

  const [taskListStyle, setTaskListStyle] = useState<taskListStyle>('cardListStyle');

  useEffect(() => {
    const saved = localStorage.getItem('taskListStyle');
    if (saved === 'rowListStyle' || saved === 'cardListStyle') {
      setTaskListStyle(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('taskListStyle', taskListStyle);
  }, [taskListStyle]);


  return (
    <div className={`${taskListStyle} group p-1 py-4 sm:p-4 !pt-21 max-w-[1600px] relative`}>
      <div className="flex justify-between items-center relative">
        <select value={taskListStyle} onChange={(e) => setTaskListStyle(e.target.value as taskListStyle)} className="w-fit py-1.5 px-3 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25">
          <option value='cardListStyle'>カード型リスト</option>
          <option value='rowListStyle'>列型リスト</option>
        </select>
        <AddTask></AddTask>
      </div>
      <TaskList></TaskList>
    </div>
  );
}
