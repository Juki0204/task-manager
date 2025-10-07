"use client";

import { createContext, useContext, useEffect, useState } from "react";

type TaskListStyle = "cardListStyle" | "rowListStyle";
type Filters = {
  clients: string[]; //クライアント
  assignees: string[]; //担当者
  statuses: string[]; //ステータス
  searchKeywords: string | null; //検索
}

type TaskListPreferencesContextType = {
  taskListStyle: TaskListStyle;
  setTaskListStyle: (style: TaskListStyle) => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  resetFilters: () => void;
};


const TaskListPreferencesContext = createContext<TaskListPreferencesContextType | undefined>(
  undefined
);

export function TaskListPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [taskListStyle, setTaskListStyle] = useState<TaskListStyle>("cardListStyle");

  // 初回に localStorage から読み込み
  useEffect(() => {
    const saved = localStorage.getItem("taskListStyle");
    if (saved === "rowListStyle" || saved === "cardListStyle") {
      setTaskListStyle(saved);
    }
  }, []);

  // 値が変わったら localStorage に保存
  useEffect(() => {
    if (taskListStyle) {
      localStorage.setItem("taskListStyle", taskListStyle);
    }
  }, [taskListStyle]);

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
