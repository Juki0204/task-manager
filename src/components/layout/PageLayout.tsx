"use client";

import SideMenu from "@/components/SideMenu";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { usePathname } from "next/navigation";
import { type ReactNode, type MouseEventHandler, useState, useRef, useEffect } from "react";
import { FaFilter } from "react-icons/fa";
import MultiSelectPopover from "../ui/MultiSelectPopover";
import { FaSearch } from "react-icons/fa";
import { Input } from "@headlessui/react";

type PageLayoutProps = {
  children: ReactNode;

  // タイトル部分
  title: ReactNode;
  titleAddon?: ReactNode;
  actions?: ReactNode;

  // 外側wrapper調整
  overflowX?: "hidden" | "clip" | "auto";

  // 例外調整用
  className?: string;
  headerClassName?: string;
  titleAreaClassName?: string;

  onClick?: MouseEventHandler<HTMLElement>;
};

type TaskListSortType = "byDate" | "byManager";
type InvoiceSortStates = "byDate" | "byClient" | "byClientRev";

const overflowClasses = {
  hidden: "overflow-x-hidden",
  clip: "overflow-x-clip",
  auto: "overflow-x-auto",
};

const SideMenuToggleClass = {
  open: "pl-64",
  close: "pl-12",
}

export function PageLayout({
  children,
  title,
  titleAddon,
  actions,
  overflowX = "hidden",
  className = "",
  headerClassName = "",
  titleAreaClassName = "",
  onClick,
}: PageLayoutProps) {
  const [isScroll, setIsScroll] = useState<boolean>(false);
  const threshold = 50;
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const {
    taskListSortType,
    setTaskListSortType,
    invoiceSortState,
    setInvoiceSortState,
    filters,
    setFilters
  } = useTaskListPreferences();

  const nonFilterPathname = ["/dashboard", "/setting", "/release-notes", "/rule"];
  const pathname = usePathname();

  return (
    <main
      onClick={onClick}
      className={[
        "text-neutral-700 dark:text-neutral-100",
        "p-2 pt-0 pl-3 max-w-[1920px] duration-300 transition-[padding]",
        // overflowClasses[overflowX],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >

      <header
        className={[
          "sticky top-0 py-2 bg-neutral-100 dark:bg-neutral-700 flex flex-col z-40",
          headerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex gap-4 justify-between border-b-2 border-neutral-300 dark:border-neutral-700 p-1 pb-2">
          <div
            className={[
              "flex min-w-0 items-center justify-start gap-4",
              titleAreaClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <h1 className="flex items-center gap-1 text-center text-xl font-bold">
              {title}
            </h1>

            {titleAddon}

            {!nonFilterPathname.includes(pathname) && (
              <div className="flex gap-2 items-center" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                <FaFilter className="text-neutral-500 dark:text-neutral-100 cursor-pointer" />
              </div>
            )}
          </div>

          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>

        <div className={`flex gap-2 items-center relative pt-2 transition-all ease-out dark:text-neutral-700 duration-200 -z-10
          ${isFilterOpen ? "h-11" : "!h-0 !pt-0 opacity-0 overflow-hidden"}`}>
          {pathname === "/" ? (
            <div className="pr-2 border-r border-neutral-300 dark:border-neutral-500">
              <select
                tabIndex={-1}
                value={taskListSortType}
                onChange={(e) => setTaskListSortType(e.target.value as TaskListSortType)}
                className={`w-fit py-1 pl-2 pr-3 text-sm outline dark:outline-0 outline-neutral-400 bg-neutral-100 rounded-md dark:focus:not-data-focus:outline-none dark:data-focus:outline-2 dark:data-focus:-outline-offset-2 dark:data-focus:outline-black/25`}>
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
                  className={`w-fit py-1 pl-2 pr-3 text-sm bg-neutral-300 dark:bg-neutral-100 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25`}>
                  <option value="byDate">完了日順</option>
                  <option value="byClient">クライアント順(昇順)</option>
                  <option value="byClientRev">クライアント順(降順)</option>
                </select>
              </div>
            ) : (
              <></>
            )
          }

          <div className={`flex items-center gap-2 text-sm`}>
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
        </div>
      </header>

      {children}
    </main>
  );
}