"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";
import AddTask from "@/components/AddTask";

import { getCurrentUser } from "./function/getCurrentUser";
import LogoutBtn from "@/components/LogoutBtn";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4">
      <LogoutBtn></LogoutBtn>
      <AddTask></AddTask>
      <div className="p-4 mt-4 rounded-md bg-neutral-700">
        <p className="text-white">ユーザー：{currentUserName}さん</p>
        <p className="text-white">所属：{currentUserEmployee}</p>
        <p className="text-white">Email：{currentUserEmail}</p>
      </div>
    </div>
  );
}
