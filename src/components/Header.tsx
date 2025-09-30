"use client";

import { useEffect, useState } from "react";
import LogoutBtn from "./LogoutBtn";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import { Button } from "@headlessui/react";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";



export default function Header() {
  const { user, loading } = useAuth();
  // console.log(user);

  const router = useRouter();

  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserEmployee, setCurrentUserEmployee] = useState<string>('');

  const setCurrentUser = async () => {
    if (user) {
      setCurrentUserName(user.name);
      setCurrentUserEmail(user.email);
      setCurrentUserEmployee(user.employee);
    }
  }

  useEffect(() => {
    setCurrentUser();
  }, [user]);

  const falsePathname = ['/login', '/reset', '/signup']
  const pathname = usePathname();

  const isExculedPath = falsePathname.some((path) => pathname.includes(path));

  return (
    <>
      {!isExculedPath ?
        <header className="fixed top-0 w-full flex justify-end gap-8 p-4 items-center bg-neutral-700 z-10">
          <div className="flex gap-4 flex-1">
            <Button className="rounded bg-slate-500 px-4 py-2 text-sm text-white font-bold data-hover:bg-sky-700 cursor-pointer" onClick={() => router.push('/')}>全体タスク</Button>
            <Button className="rounded bg-slate-500 px-4 py-2 text-sm text-white font-bold data-hover:bg-sky-700 cursor-pointer" onClick={() => router.push('/personal')}>個別タスク</Button>
            <Button className="rounded bg-slate-500 px-4 py-2 text-sm text-white font-bold data-hover:bg-sky-700 cursor-pointer" onClick={() => router.push('/complete')}>完了済タスク</Button>
            <Button className="rounded bg-[#994b4b] w-10 grid place-content-center p-2 text-sm text-white font-bold data-hover:bg-red-800 cursor-pointer" onClick={() => router.push('/trash')}><FaRegTrashAlt /></Button>
            <Button className="rounded bg-slate-600 w-10 grid place-content-center p-2 text-sm text-white font-bold data-hover:bg-sky-700 cursor-pointer" onClick={() => router.push('/setting')}><IoSettingsOutline /></Button>
          </div>
          <div className="sm:flex gap-8 rounded-md">
            <p className="text-white">ユーザー：{currentUserName} さん</p>
            {/* <p className="text-white">所属：{currentUserEmployee}</p>
            <p className="text-white">Email：{currentUserEmail}</p> */}
          </div>
          <LogoutBtn></LogoutBtn>
        </header>
        :
        <></>
      }
    </>
  )
}