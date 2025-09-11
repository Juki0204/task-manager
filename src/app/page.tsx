"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";
import AddTask from "@/components/AddTask";

import { getCurrentUser } from "./function/getCurrentUser";
import LogoutBtn from "@/components/LogoutBtn";

import TaskList from "@/components/TaskList";

type taskListStyle = "rowListStyle" | "cardListStyle";

export default function Home() {
  // const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserEmployee, setCurrentUserEmployee] = useState<string>('');

  const [taskListStyle, setTaskListStyle] = useState<taskListStyle>('cardListStyle');

  const setCurrentUser = async () => {
    const user = await getCurrentUser();
    if (user) {
      // setCurrentUserId(user.id);
      setCurrentUserName(user.name);
      setCurrentUserEmail(user.email);
      setCurrentUserEmployee(user.employee);
    }
  }

  useEffect(() => {
    setCurrentUser();

    const saved = localStorage.getItem('taskListStyle');
    if (saved === 'rowListStyle' || saved === 'cardListStyle') {
      setTaskListStyle(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('taskListStyle', taskListStyle);
  }, [taskListStyle]);


  return (
    <div className={`${taskListStyle} group p-1 py-4 sm:p-4 max-w-[1600px] relative`}>
      <div className="flex justify-between items-center">
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
