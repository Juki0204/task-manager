import { Task } from "../types/task";
import { DiffResult } from "./comparHistory";

export function generateChangeMessage(diff: DiffResult, task: Task): string | null {
  // const userName = task.updated_manager;
  const serial = task.serial;

  const templates: Record<string, (o: string | null | undefined, n: string | null | undefined) => string | null> = {
    client: (o, n) => `クライアントを「${o}」から「${n}」に変更`,
    require: (o, n) => `依頼者を「${o}」から「${n}」に変更`,
    title: (o, n) => `作業タイトルを「${o}」から「${n}」に変更`,
    description: (o, n) => `作業内容を「${o}」から「${n}」に変更`,
    request_date: (o, n) => `依頼日を「${o}」から「${n}」に変更`,
    manager: (o, n) => `作業担当者を「${o || "未設定"}」から「${n || "未設定"}」に変更`,
    priority: (o, n) => `優先度を「${o === "急" ? "至急" : o || "未設定"}」から「${n === "急" ? "至急" : n || "未設定"}」に変更`,
    remarks: () => `備考欄を更新`,
  };

  const fragments: string[] = [];

  for (const key of diff.changedKeys) {
    const template = templates[key];
    if (!template) continue;
    const part = template(diff.old[key], diff.new[key]);
    if (part) fragments.push(part);
  }

  if (fragments.length === 0) return null;

  const combined = fragments.map((frag, index) => index === fragments.length - 1 ? `${frag}しました。` : `${frag}し、`).join("");

  return `【${serial}】${combined}`;
}