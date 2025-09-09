"use client";

import { getCurrentUser } from "@/app/function/getCurrentUser";
import { useEffect, useState } from "react";
import LogoutBtn from "./LogoutBtn";
import { usePathname } from "next/navigation";


export default function Header() {
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

  const falsePathname = ['/login', '/reset', '/signup']
  const pathname = usePathname();

  const isExculedPath = falsePathname.some((path) => pathname.includes(path));

  return (
    <>
      {!isExculedPath ?
        <header className="w-full flex justify-end gap-8 p-4 items-center bg-neutral-700">
          <div className="sm:flex gap-8 rounded-md">
            <p className="text-white">ユーザー：{currentUserName} さん</p>
            <p className="text-white">所属：{currentUserEmployee}</p>
            <p className="text-white">Email：{currentUserEmail}</p>
          </div>
          <LogoutBtn></LogoutBtn>
        </header>
        :
        <></>
      }
    </>
  )
}