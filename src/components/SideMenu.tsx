"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import { Button, Input } from "@headlessui/react";

import MenuBtn from "./MenuBtn";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { AddTaskBtn, SideMenuBtn, UserMenu, WithBadgeSideMenuBtn } from "@/components/ui/SideMenuBtn";
import { CalendarCheck, CirclePlus, ClipboardList, LayoutDashboard, MessageSquareWarning, Plus, ScrollText, Settings, Star, Trash2, User, Users } from "lucide-react";
import { useTask } from "./providers/TaskProvider";

// interface SideMenuProps {
//   onClick: () => void;
// }

export default function SideMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const { openAdd, isPanelOpen } = useTask();

  function handleReport() {
    const report = confirm("報告用のスプレッドシートに移行します。");
    if (report) {
      const url = "https://docs.google.com/spreadsheets/d/1FdoMJdYkvDI0zE3LVSw4qlpvt1DHB7qJPHOmH691qeA/edit?usp=sharing";
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  const falsePathname = ['/login', '/reset', '/signup']
  const pathname = usePathname();

  const isExculedPath = falsePathname.some((path) => pathname.includes(path));

  return (
    <>
      {!isExculedPath && (
        <aside className={`w-11 fixed top-0 left-0 h-svh z-110 text-neutral-700 dark:text-neutral-100 bg-neutral-200 dark:bg-neutral-600 backdrop-blur-md dark:border-b border-neutral-600 duration-300 transition-[width]`}>
          <div className="">
            {/* タスク追加ボタン */}
            {/* <div className="flex gap-2">
              <AddTask />
            </div> */}
            {/* バグ報告ボタン */}
            {/* <MenuBtn /> */}
            {/* <Button tabIndex={-1} onClick={onClick} className="cursor-pointer p-3 grid place-content-center">
              <ChevronDownIcon className={`${isSideMenuOpen ? "rotate-90" : "-rotate-90"}`} />
            </Button> */}
            {/* <Button className="w-full aspect-square bg-blue-600 p-1.5 flex items-center justify-center">
              <Plus className="text-white" />
            </Button> */}
          </div>

          <div className={`w-full h-full grid grid-rows-[auto_1fr] justify-between gap-2 pb-2 transition-all ease-out duration-200`}>
            <div className="flex flex-col">
              <AddTaskBtn
                onClick={openAdd}
                isPanelOpen={isPanelOpen}
              />

              <SideMenuBtn
                title="ダッシュボード"
                icon={<LayoutDashboard className="w-5" />}
                pathname="/dashboard"
                onClick={() => router.push('/dashboard')}
              />

              <hr className="text-neutral-400/50 my-1 w-7/10 mx-auto" />

              <SideMenuBtn
                title="全体タスク"
                icon={<Users className={`w-5`} />}
                pathname="/"
                onClick={() => router.push('/')}
              />

              <SideMenuBtn
                title="個人タスク"
                icon={<User className="w-5" />}
                pathname="/personal"
                onClick={() => router.push('/personal')}
              />

              <SideMenuBtn
                title="完了済みタスク"
                icon={<CalendarCheck className="w-5" />}
                pathname="/complete"
                onClick={() => router.push('/complete')}
              />

              <SideMenuBtn
                title="重要タスク"
                icon={<Star className="w-5" />}
                pathname="/important"
                onClick={() => router.push('/important')}
              />

              <SideMenuBtn
                title="削除済みタスク"
                icon={<Trash2 className="w-5" />}
                pathname="/trash"
                onClick={() => router.push('/trash')}
              />

              <hr className="text-neutral-400/50 my-1 w-7/10 mx-auto" />

              <WithBadgeSideMenuBtn
                title="掲示板"
                icon={<ClipboardList className="w-5" />}
                pathname="/rule"
                onClick={() => router.push('/rule')}
              />

              <SideMenuBtn
                title="請求一覧"
                icon={<ScrollText className="w-5" />}
                pathname="/invoice"
                onClick={() => router.push('/invoice')}
              />

              <hr className="text-neutral-400/50 my-1 w-7/10 mx-auto" />

              <SideMenuBtn
                title="各種設定"
                icon={<Settings className="w-5" />}
                pathname="/setting"
                onClick={() => router.push('/setting')}
              />

              <SideMenuBtn
                title="フィードバック"
                icon={<MessageSquareWarning className="w-5" />}
                pathname=""
                onClick={handleReport}
              />

              {/* <div className="p-2 flex justify-end">
                <button tabIndex={-1} className="flex gap-1 items-center py-1.25 px-3 bg-green-700/80 dark:bg-green-800 text-neutral-100 rounded-md hover:opacity-60 cursor-pointer" onClick={handleReport}><TbMessageReport className="text-xl" /></button>
              </div> */}

            </div>

            <div className="flex flex-col items-center justify-end">
              <div className="grid w-full aspect-square place-content-center">
                <ThemeSwitcher />
              </div>

              <UserMenu />
              {/* <TaskNotesViewer /> */}
            </div>

          </div>

          {/* <div className={`flex gap-2 items-center relative pt-2 transition-all ease-out dark:text-neutral-700 duration-200 -z-10
            ${!isScroll && pathname !== "/dashboard" && pathname !== "/setting" && pathname !== "/release-notes" && pathname !== "/rule" ? "h-10" : "!h-0 !pt-0 opacity-0 overflow-hidden"}`}>
            {pathname === "/" ? (
              <div className="pr-2 border-r border-neutral-300 dark:border-neutral-500">
                <select
                  tabIndex={-1}
                  value={taskListSortType}
                  onChange={(e) => setTaskListSortType(e.target.value as TaskListSortType)}
                  className={`fit py-1 pl-2 pr-3 text-sm outline dark:outline-0 outline-neutral-400 bg-neutral-100 rounded-md dark:focus:not-data-focus:outline-none dark:data-focus:outline-2 dark:data-focus:-outline-offset-2 dark:data-focus:outline-black/25`}>
                  <option value='byDate'>日付順</option>
                  <option value='byManager'>担当者順</option>
                </select>
              </div>
            )
              : pathname === "/invoice" ? (
                <div className="pr-2 border-r border-neutral-500">
                  <select
                    tabIndex={-1}
                    value={invoiceSortState}
                    onChange={(e) => setInvoiceSortState(e.target.value as InvoiceSortStates)}
                    className={`fit py-1 pl-2 pr-3 text-sm bg-neutral-300 dark:bg-neutral-100 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25`}>
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
                <h3 className="flex gap-2 items-center"><FaFilter className="text-neutral-500 dark:text-neutral-100" /><span className="block whitespace-nowrap dark:text-neutral-100">フィルタ：</span></h3>
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
                    { id: 6, label: "岡本" },
                    { id: 7, label: "未担当" },
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
                    tabIndex={-1}
                    type="text"
                    className="flex w-60 items-center justify-between rounded-md border border-gray-400 dark:border-gray-300 bg-neutral-100 px-4 pl-8 py-1 text-sm font-medium dark:shadow-sm hover:bg-gray-50 focus:outline-none placeholder:text-neutral-400 placeholder:font-normal"
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
          </div> */}
        </aside >
      )
      }
    </>
  )

}
