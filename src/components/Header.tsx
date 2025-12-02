"use client";

import React, { useEffect, useState } from "react";
import LogoutBtn from "@/components/ui/LogoutBtn";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import { Button, Input } from "@headlessui/react";
import { FaRegTrashAlt, FaFilter, FaUserCircle } from "react-icons/fa";

import { FaSearch } from "react-icons/fa";

import { RiTeamFill } from "react-icons/ri";
import { IoPerson, IoReceipt } from "react-icons/io5";
import { FaRegCalendarCheck } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";


import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import MultiSelectPopover from "./ui/MultiSelectPopover";

// type TaskListStyle = "rowListStyle" | "cardListStyle";
type TaskListSortType = "byDate" | "byManager";

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const [currentUserName, setCurrentUserName] = useState<string>('');
  // const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  // const [currentUserEmployee, setCurrentUserEmployee] = useState<string>('');

  const {
    //taskListStyle,
    //setTaskListStyle,
    taskListSortType,
    setTaskListSortType,
    filters,
    setFilters
  } = useTaskListPreferences();

  const setCurrentUser = async () => {
    if (user) {
      setCurrentUserName(user.name);
      // setCurrentUserEmail(user.email);
      // setCurrentUserEmployee(user.employee);
    }
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
      {!isExculedPath && (
        <header className="fixed top-0 w-full min-w-[1900px] py-2 px-4 z-50 bg-neutral-600/70 backdrop-blur-md shadow-lg border-b border-neutral-600">
          <div className="w-full flex justify-end gap-8 items-center pb-2 border-b border-neutral-500">
            <div className="flex gap-2 flex-1">
              <Button
                className={`flex items-center gap-1 rounded px-4 py-2 text-sm text-white font-bold data-hover:bg-sky-700 ${pathname === "/" ? "bg-sky-700" : "bg-slate-500 cursor-pointer"}`}
                onClick={() => router.push('/')}
              >
                <RiTeamFill />全体タスク
              </Button>

              <Button
                className={`flex items-center gap-1 rounded px-4 py-2 text-sm text-white font-bold data-hover:bg-sky-700 ${pathname === "/personal" ? "bg-sky-700" : "bg-slate-500 cursor-pointer"}`}
                onClick={() => router.push('/personal')}
              >
                <IoPerson />個人タスク
              </Button>

              <Button
                className={`flex items-center gap-1 rounded px-4 py-2 text-sm text-white font-bold data-hover:bg-sky-700 ${pathname === "/complete" ? "bg-sky-700" : "bg-slate-500 cursor-pointer"}`}
                onClick={() => router.push('/complete')}
              >
                <FaRegCalendarCheck />完了済タスク
              </Button>

              <Button
                className={`rounded w-10 grid place-content-center p-2 text-sm text-white font-bold data-hover:bg-red-800 ${pathname === "/trash" ? "bg-red-800" : "bg-[#994b4b] cursor-pointer"}`}
                onClick={() => router.push('/trash')}
              >
                <FaRegTrashAlt />
              </Button>

              <Button
                className={`rounded w-10 grid place-content-center p-2 text-sm text-white font-bold data-hover:bg-sky-700 ${pathname === "/setting" ? "bg-sky-700" : "bg-slate-600 cursor-pointer"}`}
                onClick={() => router.push('/setting')}
              >
                <FaGear />
              </Button>

              <div className="border-l border-neutral-500 px-2 flex">
                <Button
                  className={`flex items-center gap-1 rounded pl-3.5 pr-4.5 p-2 text-sm text-white font-bold data-hover:bg-purple-700 ${pathname === "/invoice" ? "bg-purple-700" : "bg-slate-500 cursor-pointer"}`}
                  onClick={() => router.push('/invoice')}
                >
                  <IoReceipt />請求一覧
                </Button>
              </div>
            </div>
            <div className="sm:flex gap-4 rounded-md items-center">
              <p className="text-white flex items-center gap-2"><FaUserCircle />{currentUserName} さん</p>
              {/* <p className="text-white">所属：{currentUserEmployee}</p>
            <p className="text-white">Email：{currentUserEmail}</p> */}
            </div>
            <LogoutBtn />
          </div>

          <div className="flex gap-2 items-center relative pt-2 min-h-10.75">
            {/* {pathname !== "/personal" && pathname !== "/invoice" && pathname !== "/setting" && pathname !== "/release-notes" && (
              <select
                value={taskListStyle}
                onChange={(e) => setTaskListStyle(e.target.value as TaskListStyle)}
                className="w-fit py-1.5 pl-2 pr-3 border-gray-300 bg-white rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25">
                <option value='cardListStyle'>カード型リスト</option>
                <option value='rowListStyle'>列型リスト</option>
              </select>
            )} */}

            {pathname === "/" && (
              <select
                value={taskListSortType}
                onChange={(e) => setTaskListSortType(e.target.value as TaskListSortType)}
                className="w-fit py-1.5 pl-2 pr-3 border-gray-300 bg-white rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25">
                <option value='byDate'>日付順ソート</option>
                <option value='byManager'>担当者順ソート</option>
              </select>
            )}

            {pathname !== "/invoice" && pathname !== "/setting" && pathname !== "/release-notes" && (
              <div className={`flex items-center gap-2 border-neutral-500 ${pathname === "/personal" ? "" : "border-l px-2"}`}>
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
                  selectedLabels={filters.clients}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      clients: e.target.checked
                        ? [...filters.clients, label]
                        : filters.clients.filter((c) => c !== label)
                    })
                  }
                  defaultText="クライアント"
                />

                <MultiSelectPopover
                  options={[
                    { id: 1, label: "浜口" },
                    { id: 2, label: "飯塚" },
                    { id: 3, label: "谷" },
                    { id: 4, label: "田口" },
                    { id: 5, label: "西谷" },
                    { id: 6, label: "未担当" },
                  ]}
                  selectedLabels={filters.assignees}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      assignees: e.target.checked
                        ? [...filters.assignees, label]
                        : filters.assignees.filter((a) => a !== label)
                    })
                  }
                  defaultText="作業担当者"
                />

                <MultiSelectPopover
                  options={[
                    { id: 1, label: "未着手" },
                    { id: 2, label: "作業中" },
                    { id: 3, label: "作業途中" },
                    { id: 4, label: "確認中" },
                    { id: 5, label: "詳細待ち" },
                    { id: 6, label: "保留" },
                  ]}
                  selectedLabels={filters.statuses}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      statuses: e.target.checked
                        ? [...filters.statuses, label]
                        : filters.statuses.filter((s) => s !== label)
                    })
                  }
                  defaultText="作業状況"
                />

                <div className="relative">
                  <FaSearch className="absolute top-1/2 left-2 -translate-y-1/2" />
                  <Input
                    type="text"
                    className="flex w-65 items-center justify-between rounded-md border border-gray-300 bg-white px-4 pl-8 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none placeholder:text-neutral-400 placeholder:font-normal"
                    placeholder="No./タイトル/内容/依頼者"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;

                      setFilters({
                        ...filters,
                        searchKeywords: value.trim() === "" ? null : value,
                      });
                    }}
                  />
                </div>

                {/* <CorrectBtn className="!m-0 py-2 !w-30 text-sm rounded-md" onClick={handleApply}>フィルタリング</CorrectBtn> */}
                {/* <CorrectBtn className="!m-0 py-2 !w-30 text-sm rounded-md bg-slate-500" onClick={resetFilters}>リセット</CorrectBtn> */}
              </div>
            )}
          </div>
        </header>
      )}
    </>
  )
}