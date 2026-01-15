"use client";

import React, { useEffect, useState } from "react";
import LogoutBtn from "@/components/ui/LogoutBtn";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import { Button, Input } from "@headlessui/react";
import { FaRegTrashAlt, FaFilter, FaUserCircle } from "react-icons/fa";

import { FaSearch } from "react-icons/fa";

import { RiTeamFill } from "react-icons/ri";
import { IoFlag, IoPerson, IoReceipt } from "react-icons/io5";
import { FaRegCalendarCheck } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { MdPlace, MdSpaceDashboard } from "react-icons/md";

import { TbMessageReport } from "react-icons/tb";

import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import MultiSelectPopover from "./ui/MultiSelectPopover";
import HelpDrawer from "./HelpDrawer";
import AddTask from "./AddTask";
import TaskNotesViewer from "./TaskNotesViewer";

// type TaskListStyle = "rowListStyle" | "cardListStyle";
type TaskListSortType = "byDate" | "byManager";
type InvoiceSortStates = "byDate" | "byClient" | "byClientRev";

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);

  const [currentUserName, setCurrentUserName] = useState<string>('');
  // const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  // const [currentUserEmployee, setCurrentUserEmployee] = useState<string>('');

  const pageIndex: Record<string, string> = {
    "/": "全体タスク一覧",
    "/personal": "個人タスク一覧",
    "/complete": "完了タスク一覧",
    "/important": "重要タスク一覧",
    "/trash": "削除済タスク一覧",
    "/setting": "各種設定",
    "/invoice": "請求データ一覧",
    "/release-notes": "リリースノート一覧",
    "/dashboard": "ダッシュボード"
  }

  const {
    //taskListStyle,
    //setTaskListStyle,
    taskListSortType,
    setTaskListSortType,
    invoiceSortState,
    setInvoiceSortState,
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

  function handleReport() {
    const report = confirm("報告用のスプレッドシートに移行します。");
    if (report) {
      const url = "https://docs.google.com/spreadsheets/d/1FdoMJdYkvDI0zE3LVSw4qlpvt1DHB7qJPHOmH691qeA/edit?usp=sharing";
      window.open(url, '_blank', 'noopener,noreferrer');
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
          <div className="w-full flex justify-end gap-2 items-center pb-2 border-b border-neutral-500">
            <div className="flex gap-2 flex-1">
              <Button
                className={`flex items-center gap-1 rounded px-4 py-2 text-sm text-white font-bold data-hover:bg-blue-500/50 ${pathname === "/dashboard" ? "bg-blue-500/50" : "bg-slate-500 cursor-pointer"}`}
                onClick={() => router.push('/dashboard')}
              >
                <MdSpaceDashboard />ダッシュボード
              </Button>

              <Button
                className={`flex items-center gap-1 rounded px-4 py-2 text-sm text-white font-bold data-hover:bg-blue-500/50 ${pathname === "/" ? "bg-blue-500/50" : "bg-slate-500 cursor-pointer"}`}
                onClick={() => router.push('/')}
              >
                <RiTeamFill />全体
              </Button>

              <Button
                className={`flex items-center gap-1 rounded px-4 py-2 text-sm text-white font-bold data-hover:bg-blue-500/50 ${pathname === "/personal" ? "bg-blue-500/50" : "bg-slate-500 cursor-pointer"}`}
                onClick={() => router.push('/personal')}
              >
                <IoPerson />個人
              </Button>

              <Button
                className={`flex items-center gap-1 rounded px-4 py-2 text-sm text-white font-bold data-hover:bg-blue-500/50 ${pathname === "/complete" ? "bg-blue-500/50" : "bg-slate-500 cursor-pointer"}`}
                onClick={() => router.push('/complete')}
              >
                <FaRegCalendarCheck />完了済
              </Button>

              <Button
                className={`rounded w-10 grid place-content-center p-2 text-sm text-white font-bold data-hover:bg-red-500/50 ${pathname === "/important" ? "bg-red-500/50" : "bg-[#994b4b] cursor-pointer"}`}
                onClick={() => router.push('/important')}
              >
                <IoFlag />
              </Button>

              <Button
                className={`rounded w-10 grid place-content-center p-2 text-sm text-white font-bold data-hover:bg-red-500/50 ${pathname === "/trash" ? "bg-red-500/50" : "bg-[#994b4b] cursor-pointer"}`}
                onClick={() => router.push('/trash')}
              >
                <FaRegTrashAlt />
              </Button>

              <Button
                className={`rounded w-10 grid place-content-center p-2 text-sm text-white font-bold data-hover:bg-blue-500/50 ${pathname === "/setting" ? "bg-blue-500/50" : "bg-slate-600 cursor-pointer"}`}
                onClick={() => router.push('/setting')}
              >
                <FaGear />
              </Button>

              <div className="border-l border-neutral-500 px-2 flex">
                <Button
                  className={`flex items-center gap-1 rounded pl-3.5 pr-4.5 p-2 text-sm text-white font-bold data-hover:bg-purple-500/50 ${pathname === "/invoice" ? "bg-purple-500/50" : "bg-slate-500 cursor-pointer"}`}
                  onClick={() => router.push('/invoice')}
                >
                  <IoReceipt />請求一覧
                </Button>
              </div>
            </div>
            <div className="sm:flex gap-2 rounded-md items-center">
              {/* タスク追加ボタン */}
              <div className="flex gap-2">
                <AddTask />
              </div>
              {/* バグ報告ボタン */}
              <button className="flex gap-1 items-center py-2 px-3 bg-green-800 text-white rounded-md hover:opacity-60 cursor-pointer" onClick={handleReport}><TbMessageReport className="text-xl" /></button>
              {/* <HelpDrawer /> */}
              {/* <div className="flex gap-1 items-center py-2 pl-4 pr-6 text-sm tracking-wider rounded-md bg-black/20 text-white"><MdPlace />{pageIndex[pathname]}</div> */}
              <div onMouseEnter={() => setIsLogoutOpen(true)} onMouseLeave={() => setIsLogoutOpen(false)} className="relative text-white flex items-center justify-center gap-2 p-1.5 px-2 w-30 rounded-md transition-all duration-100 bg-neutral-600 cursor-pointer">
                {!isLogoutOpen ? (
                  <><FaUserCircle />{currentUserName} さん</>
                ) : (
                  <LogoutBtn />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center relative pt-2 min-h-10">
            {pathname === "/" ? (
              <div className="pr-2 border-r border-neutral-500">
                <select
                  value={taskListSortType}
                  onChange={(e) => setTaskListSortType(e.target.value as TaskListSortType)}
                  className={`fit py-1 pl-2 pr-3 text-sm border-gray-300 bg-white rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25`}>
                  <option value='byDate'>日付順</option>
                  <option value='byManager'>担当者順</option>
                </select>
              </div>
            )
              : pathname === "/invoice" ? (
                <div className="pr-2 border-r border-neutral-500">
                  <select
                    value={invoiceSortState}
                    onChange={(e) => setInvoiceSortState(e.target.value as InvoiceSortStates)}
                    className={`fit py-1 pl-2 pr-3 text-sm border-gray-300 bg-white rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25`}>
                    <option value="byDate">完了日順</option>
                    <option value="byClient">クライアント順(昇順)</option>
                    <option value="byClientRev">クライアント順(降順)</option>
                  </select>
                </div>
              ) : (
                <></>
              )
            }

            {pathname !== "/setting" && pathname !== "/release-notes" && (
              <div className={`flex items-center gap-2 text-sm`}>
                <h3 className="flex gap-2 items-center text-white"><FaFilter className="text-white" />フィルタリング：</h3>
                <MultiSelectPopover
                  options={[
                    { id: 1, label: "難波秘密倶楽部" },
                    { id: 2, label: "新大阪秘密倶楽部" },
                    { id: 3, label: "谷町秘密倶楽部" },
                    { id: 4, label: "谷町人妻ゴールデン" },
                    { id: 5, label: "梅田人妻秘密倶楽部" },
                    { id: 6, label: "梅田ゴールデン" },
                    { id: 7, label: "中洲秘密倶楽部" },
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
                  width={140}
                />

                {pathname !== "/invoice" && (
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
                    width={120}
                  />
                )}

                <div className="relative">
                  <FaSearch className="absolute top-1/2 left-2 -translate-y-1/2" />
                  <Input
                    type="text"
                    className="flex w-65 items-center justify-between rounded-md border border-gray-300 bg-white px-4 pl-8 py-1 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none placeholder:text-neutral-400 placeholder:font-normal"
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
              </div>
            )}

            <div className="flex-1">
              <TaskNotesViewer />
            </div>
          </div>
        </header>
      )}
    </>
  )
}