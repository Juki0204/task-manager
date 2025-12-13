"use client";

import { createContext, useContext, useEffect, useState } from "react";

type TaskListStyle = "cardListStyle" | "rowListStyle";
type TaskListSortType = "byDate" | "byManager";

type Filters = {
  clients: string[]; //クライアント
  assignees: string[]; //担当者
  statuses: string[]; //ステータス
  searchKeywords: string | null; //検索
}

type TaskListPreferencesContextType = {
  taskListStyle: TaskListStyle;
  setTaskListStyle: (style: TaskListStyle) => void;
  taskListSortType: TaskListSortType;
  setTaskListSortType: (type: TaskListSortType) => void;
  invoiceSortState: InvoiceSortStates;
  setInvoiceSortState: (state: InvoiceSortStates) => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  resetFilters: () => void;
};

type InvoiceSortStates = "byDate" | "byClient" | "byClientRev";

const TaskListPreferencesContext = createContext<TaskListPreferencesContextType | undefined>(
  undefined
);

export function TaskListPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [taskListStyle, setTaskListStyle] = useState<TaskListStyle>("rowListStyle");
  const [taskListSortType, setTaskListSortType] = useState<TaskListSortType>("byDate");
  const [invoiceSortState, setInvoiceSortState] = useState<InvoiceSortStates>("byDate");

  //初回に localStorage から読み込み
  useEffect(() => {
    // const savedStyle = localStorage.getItem("taskListStyle");
    // if (savedStyle === "rowListStyle" || savedStyle === "cardListStyle") {
    //   setTaskListStyle(savedStyle);
    // }

    const savedSortType = localStorage.getItem("taskListSortType");
    if (savedSortType === "byDate" || savedSortType === "byManager") {
      setTaskListSortType(savedSortType);
    }

    const savedInvoiceSortStates = localStorage.getItem("invoiceSortState");
    if (savedInvoiceSortStates === "byDate" || savedInvoiceSortStates === "byClient" || savedInvoiceSortStates === "byClientRev") {
      setInvoiceSortState(savedInvoiceSortStates);
    }
  }, []);

  //taskListStyle
  // useEffect(() => {
  //   if (taskListStyle) {
  //     localStorage.setItem("taskListStyle", taskListStyle);
  //   }
  // }, [taskListStyle]);

  //taskListSotyType
  useEffect(() => {
    if (taskListSortType) {
      localStorage.setItem("taskListSortType", taskListSortType);
    }
  }, [taskListSortType]);

  //invoiceSotyState
  useEffect(() => {
    if (invoiceSortState) {
      localStorage.setItem("invoiceSortState", invoiceSortState);
    }
  }, [invoiceSortState]);

  //フィルタリング
  const [filters, setFilters] = useState<Filters>({
    clients: [],
    assignees: [],
    statuses: [],
    searchKeywords: null,
  });

  const resetFilters = () => {
    setFilters({
      clients: [],
      assignees: [],
      statuses: [],
      searchKeywords: null,
    })
  }

  return (
    <TaskListPreferencesContext.Provider
      value={{
        taskListStyle,
        setTaskListStyle,
        taskListSortType,
        setTaskListSortType,
        invoiceSortState,
        setInvoiceSortState,
        filters,
        setFilters,
        resetFilters,
      }}>
      {children}
    </TaskListPreferencesContext.Provider>
  );
}

// カスタムフックで呼び出し
export function useTaskListPreferences() {
  const ctx = useContext(TaskListPreferencesContext);
  if (!ctx) throw new Error("useTaskListStyle must be used within TaskListPreferencesProvider");
  return ctx;
}
