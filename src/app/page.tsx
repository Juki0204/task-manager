"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";
import AddTask from "@/components/AddTask";

import { getCurrentUser } from "./function/getCurrentUser";
import LogoutBtn from "@/components/LogoutBtn";

import { FaRegBuilding, FaRegCheckCircle } from "react-icons/fa";
import { BsPerson } from "react-icons/bs";
import { RiCalendarScheduleLine } from "react-icons/ri";

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
      <div className="p-4 my-4 rounded-md bg-neutral-700">
        <p className="text-white">ユーザー：{currentUserName}さん</p>
        <p className="text-white">所属：{currentUserEmployee}</p>
        <p className="text-white">Email：{currentUserEmail}</p>
      </div>

      <div className="w-1/2 rounded-xl border-2 border-neutral-600 bg-neutral-800 p-4 text-white tracking-wide">
        <div className="flex mb-1 justify-between">
          <h3 className="font-bold text-lg truncate">おまかせ祭り</h3>
          <div className="w-fit flex gap-1 items-center pl-1">
            <span className="py-1 px-2 h-fit rounded-md text-xs font-bold bg-red-300 text-red-800 whitespace-nowrap">至急</span>
            <span className="py-1 px-2 h-fit rounded-md text-xs font-bold bg-sky-300 text-sky-800 whitespace-nowrap">作業中</span>
          </div>
        </div>
        <div className="line-clamp-2 w-full h-12 mb-3">
          9/6～9/8開催分　告知ページ更新作業
        </div>
        <div className="grid gap-2 grid-cols-6">
          <div className="col-span-4 flex gap-1 items-center border-b border-neutral-600"><FaRegBuilding />谷町人妻ゴールデン 《青木》</div>
          <div className="col-span-2 flex gap-1 items-center border-b border-neutral-600"><BsPerson />なおまる</div>
          <div className="col-span-3 flex gap-1 items-center border-b border-neutral-600"><RiCalendarScheduleLine />9月5日</div>
          <div className="col-span-3 flex gap-1 items-center border-b border-neutral-600"><FaRegCheckCircle />-</div>
        </div>
      </div>
    </div>
  );
}
