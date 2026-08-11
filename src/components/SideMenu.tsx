"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import { Button, Input } from "@headlessui/react";

import MenuBtn from "./MenuBtn";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { SideMenuBtn, UserMenu, WithBadgeSideMenuBtn } from "@/components/ui/SideMenuBtn";
import { CalendarCheck, ChevronDownIcon, ClipboardList, LayoutDashboard, MessageSquareWarning, ScrollText, Settings, Star, Trash2, User, Users } from "lucide-react";

interface SideMenuProps {
  onClick: () => void;
  isSideMenuOpen: boolean;
}

export default function SideMenu({ onClick, isSideMenuOpen }: SideMenuProps) {
  const { user } = useAuth();
  const router = useRouter();

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
        <aside className={`fixed top-0 left-0 h-lvh z-110 text-neutral-700 dark:text-neutral-100 bg-neutral-200 dark:bg-neutral-600/70 backdrop-blur-md dark:border-b border-neutral-600 duration-300 transition-[width] ${isSideMenuOpen ? "w-60" : "w-11"}`}>
          <div className="flex items-center justify-end">
            {/* タスク追加ボタン */}
            {/* <div className="flex gap-2">
              <AddTask />
            </div> */}
            {/* バグ報告ボタン */}
            {/* <MenuBtn /> */}
            <ThemeSwitcher />
            <Button tabIndex={-1} onClick={onClick} className="cursor-pointer p-3 grid place-content-center">
              <ChevronDownIcon className={`${isSideMenuOpen ? "rotate-90" : "-rotate-90"}`} />
            </Button>
          </div>

          <div className={`w-full flex flex-col gap-2 pb-2 transition-all ease-out duration-200`}>
            <div className="flex flex-col">
              <SideMenuBtn
                title="ダッシュボード"
                icon={<LayoutDashboard className="w-5" />}
                pathname="/dashboard"
                isSideMenuOpen={isSideMenuOpen}
                onClick={() => router.push('/dashboard')}
              />

              <div className={`py-2 px-3 text-xs font-bold overflow-x-clip whitespace-nowrap ${isSideMenuOpen ? "block" : "hidden"}`}>
                作業・案件
              </div>

              <SideMenuBtn
                title="全体タスク"
                icon={<Users className={`w-5`} />}
                pathname="/"
                isSideMenuOpen={isSideMenuOpen}
                onClick={() => router.push('/')}
              />

              <SideMenuBtn
                title="個人タスク"
                icon={<User className="w-5" />}
                pathname="/personal"
                isSideMenuOpen={isSideMenuOpen}
                onClick={() => router.push('/personal')}
              />

              <SideMenuBtn
                title="完了済みタスク"
                icon={<CalendarCheck className="w-5" />}
                pathname="/complete"
                isSideMenuOpen={isSideMenuOpen}
                onClick={() => router.push('/complete')}
              />

              <SideMenuBtn
                title="重要タスク"
                icon={<Star className="w-5" />}
                pathname="/important"
                isSideMenuOpen={isSideMenuOpen}
                onClick={() => router.push('/important')}
              />

              <SideMenuBtn
                title="削除済みタスク"
                icon={<Trash2 className="w-5" />}
                pathname="/trash"
                isSideMenuOpen={isSideMenuOpen}
                onClick={() => router.push('/trash')}
              />

              <div className={`py-2 px-3 text-xs font-bold whitespace-nowrap overflow-x-clip ${isSideMenuOpen ? "block" : "hidden"}`}>
                社内共有
              </div>

              <WithBadgeSideMenuBtn
                title="掲示板"
                icon={<ClipboardList className="w-5" />}
                pathname="/rule"
                isSideMenuOpen={isSideMenuOpen}
                onClick={() => router.push('/rule')}
              />

              <SideMenuBtn
                title="請求一覧"
                icon={<ScrollText className="w-5" />}
                pathname="/invoice"
                isSideMenuOpen={isSideMenuOpen}
                onClick={() => router.push('/invoice')}
              />

              <div className={`py-2 px-3 text-xs font-bold whitespace-nowrap ${isSideMenuOpen ? "block" : "hidden"}`}>
                その他
              </div>

              <SideMenuBtn
                title="各種設定"
                icon={<Settings className="w-5" />}
                pathname="/setting"
                isSideMenuOpen={isSideMenuOpen}
                onClick={() => router.push('/setting')}
              />

              <SideMenuBtn
                title="フィードバック"
                icon={<MessageSquareWarning className="w-5" />}
                pathname=""
                isSideMenuOpen={isSideMenuOpen}
                onClick={handleReport}
              />

              {/* <UserMenu /> */}

              {/* <div className="p-2 flex justify-end">
                <button tabIndex={-1} className="flex gap-1 items-center py-1.25 px-3 bg-green-700/80 dark:bg-green-800 text-neutral-100 rounded-md hover:opacity-60 cursor-pointer" onClick={handleReport}><TbMessageReport className="text-xl" /></button>
              </div> */}

            </div>

            <div className="flex-1 min-w-0">
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
