import { Task } from "../types/task";

export interface DiffResult {
  changedKeys: (keyof Task)[];
  old: Partial<Record<keyof Task, string | null>>;
  new: Partial<Record<keyof Task, string | null>>;
}

export function compareHistory(newRow: Task, oldRow: Task): DiffResult {
  const exclude = [
    "id",
    "status",
    "method",
    "finish_date",
    "created_at",
    "created_manager",
    "updated_at",
    "updated_manager",
    "serial",
    "locked_by_id",
    "locked_by_name",
    "locked_by_at",
  ];

  const diffOld: Partial<Record<keyof Task, string | null>> = {};
  const diffNew: Partial<Record<keyof Task, string | null>> = {};
  const changedKeys: (keyof Task)[] = [];

  for (const key of Object.keys(newRow) as (keyof Task)[]) {
    if (exclude.includes(key)) continue;
    if (newRow[key] !== oldRow[key]) {
      diffOld[key] = oldRow[key];
      diffNew[key] = newRow[key];
      changedKeys.push(key);
    }
  }

  return { changedKeys, old: diffOld, new: diffNew };
}