"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";
import AddTask from "@/components/AddTask";

import { getCurrentUser } from "./function/getCurrentUser";
import LogoutBtn from "@/components/LogoutBtn";

import TaskList from "@/components/TaskList";

export default function Home() {
  // const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserEmployee, setCurrentUserEmployee] = useState<string>('');

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
  }, []);

  return (
    <div className="p-1 py-4 sm:p-4 max-w-[1600px] m-auto relative">
      <AddTask></AddTask>
      <TaskList></TaskList>
    </div>
  );
}
