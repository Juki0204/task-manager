"use client";

import React, { useEffect, useState } from "react";
import LogoutBtn from "./LogoutBtn";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import { Button, CheckboxProps } from "@headlessui/react";
import { FaRegTrashAlt, FaFilter } from "react-icons/fa";

import { IoSettingsOutline } from "react-icons/io5";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import MultiSelectPopover from "./ui/MultiSelectPopover";
import { CorrectBtn } from "./ui/Btn";

type taskListStyle = "rowListStyle" | "cardListStyle";


export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const [currentUserName, setCurrentUserName] = useState<string>('');
  // const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  // const [currentUserEmployee, setCurrentUserEmployee] = useState<string>('');

  const { taskListStyle, setTaskListStyle, filters, setFilters, resetFilters } = useTaskListPreferences();

  const setCurrentUser = async () => {
    if (user) {
      setCurrentUserName(user.name);
      // setCurrentUserEmail(user.email);
      // setCurrentUserEmployee(user.employee);
    }
  }

  const handleApply = () => {
    console.log("適用されたフィルタ:", filters);
  }

  useEffect(() => {
    setCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const falsePathname = ['/login', '/reset', '/signup']
  const pathname = usePathname();

  const isExculedPath = falsePathname.some((path) => pathname.includes(path));

  return (
    <>
      {!isExculedPath ?
        <header className="fixed top-0 w-full py-2 px-4 z-10 bg-neutral-700 shadow-lg">
          <div className="w-full flex justify-end gap-8 items-center pb-2 border-b border-neutral-500">
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
          </div>

          <div className="flex gap-4 items-center relative pt-2">
            <select
              value={taskListStyle}
              onChange={(e) => setTaskListStyle(e.target.value as taskListStyle)}
              className="w-fit py-1.5 px-3 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25">
              <option value='cardListStyle'>カード型リスト</option>
              <option value='rowListStyle'>列型リスト</option>
            </select>
            {/* <AddTaskBtn onClick={() => { setIsOpen(true); setModalType("add"); }}></AddTaskBtn> */}
            {pathname !== "/personal" && (
              <div className="flex items-center gap-2 border-l px-4 border-neutral-500">
                <h3 className="flex gap-2 items-center text-white"><FaFilter className="text-white" />フィルタリング：</h3>
                <MultiSelectPopover
                  options={[
                    { id: 1, label: "難波秘密倶楽部" },
                    { id: 2, label: "新大阪秘密倶楽部" },
                    { id: 3, label: "谷町秘密倶楽部" },
                    { id: 4, label: "谷町人妻ゴールデン" },
                    { id: 5, label: "梅田人妻秘密倶楽部" },
                    { id: 6, label: "梅田ゴールデン" },
                    { id: 7, label: "中州秘密倶楽部" },
                    { id: 8, label: "奥様クラブ" },
                    { id: 9, label: "快楽玉乱堂" },
                  ]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      clients: e.target.checked
                        ? [...filters.clients, label]
                        : filters.clients.filter((c) => c !== label)
                    })
                  }
                  defaultText="クライアント"
                ></MultiSelectPopover>

                <MultiSelectPopover
                  options={[
                    { id: 1, label: "浜口" },
                    { id: 2, label: "飯塚" },
                    { id: 3, label: "谷" },
                    { id: 4, label: "田口" },
                    { id: 5, label: "鎌倉" },
                    { id: 6, label: "西谷" },
                    { id: 7, label: "未担当" },
                  ]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      assignees: e.target.checked
                        ? [...filters.assignees, label]
                        : filters.assignees.filter((a) => a !== label)
                    })
                  }
                  defaultText="作業担当者"
                ></MultiSelectPopover>

                <MultiSelectPopover
                  options={[
                    { id: 1, label: "未着手" },
                    { id: 2, label: "作業中" },
                    { id: 3, label: "作業途中" },
                    { id: 4, label: "確認中" },
                    { id: 5, label: "詳細待ち" },
                    { id: 6, label: "保留" },
                  ]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      statuses: e.target.checked
                        ? [...filters.statuses, label]
                        : filters.statuses.filter((s) => s !== label)
                    })
                  }
                  defaultText="作業状況"
                ></MultiSelectPopover>

                {/* <CorrectBtn className="!m-0 py-2 !w-30 text-sm rounded-md" onClick={handleApply}>フィルタリング</CorrectBtn> */}
                {/* <CorrectBtn className="!m-0 py-2 !w-30 text-sm rounded-md bg-slate-500" onClick={resetFilters}>リセット</CorrectBtn> */}
              </div>
            )}
          </div>
        </header>
        :
        <></>
      }
    </>
  )
}