"use client";

import { useState } from "react";

export default function NextCheckMessage() {
  const JP_DOW = ["日", "月", "火", "水", "木", "金", "土"] as const;
  const [nextWed] = useState(() => buildNextWed());

  //10日に一番近い水曜日
  function getWed(year: number, month: number): Date {
    const d = new Date(year, month - 1, 10);

    while (d.getDay() !== 3) {
      d.setDate(d.getDate() - 1);
    }

    return d;
  }


  function addMonths(year: number, month: number, delta: number) {
    const base = new Date(year, month - 1, 1);
    base.setMonth(base.getMonth() + delta);
    return {
      year: base.getFullYear(),
      month: base.getMonth() + 1,
    };
  }

  function getActiveWed(today = new Date()): Date {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    //11日以降は翌月を対象にする
    const target =
      day >= 11
        ? addMonths(year, month, 1)
        : { year, month };

    return getWed(target.year, target.month);
  }

  //日付の日本語化
  function formatJPDate(d: Date) {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    // const dow = JP_DOW[d.getDay()];
    // return `${month}月${day}日（${dow}）`;
    return `${month}月${day}日`;
  }

  function buildNextWed(today = new Date()) {
    const wed = getActiveWed(today);
    return formatJPDate(wed);
  }

  return (
    <div className={`flex items-end gap-1 py-0.5 px-4 font-bold text-base bg-neutral-200 rounded-md tracking-wider text-neutral-800 palt`}>
      次回の日報チェックは<span className="text-red-700 palt">{nextWed}（水）</span>です。{nextWed}の午前中までに各自請求データの入力をお願いします。</div>
  )
}