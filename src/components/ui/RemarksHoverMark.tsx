"use client";

import React, { useEffect, useRef, useState } from "react";
import { CursorHoverPopup } from "./CursorHoverPopup";
import { LuNotebookPen } from "react-icons/lu";
import { Task } from "@/utils/types/task";
import { useAuth } from "@/app/AuthProvider";
import { supabase } from "@/utils/supabase/supabase";
import { useTaskUnread } from "../TaskUnreadProvider";

type RemarksHoverProps = {
  task: Task;
  children: React.ReactNode;
  handleHover: (hover: boolean) => void;
  openDelayMs?: number;
  className?: string;
};

export function RemarksHoverMark({
  task,
  children,
  handleHover,
  openDelayMs = 200,
  className,
}: RemarksHoverProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [hoveringPopup, setHoveringPopup] = useState(false);

  const openTimer = useRef<number | null>(null);
  const readTimer = useRef<number | null>(null);
  const isHoveringTrigger = useRef(false);

  const { isTaskUnread, upsertTaskAcknowledgement } = useTaskUnread();
  const unread = isTaskUnread({ id: task.id, manager: task.manager }, user?.name ?? "");

  //cleanup
  useEffect(() => {
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
      if (readTimer.current) window.clearTimeout(readTimer.current);
    };
  }, []);

  const clearTimers = () => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (readTimer.current) {
      window.clearTimeout(readTimer.current);
      readTimer.current = null;
    }
  };

  const scheduleOpen = (point: { x: number; y: number }) => {
    clearTimers();
    openTimer.current = window.setTimeout(() => {
      //まだトリガーにhover中なら開く
      if (!isHoveringTrigger.current) return;
      setAnchor(point);
      setOpen(true);
    }, openDelayMs);
  };

  const closeIfNotHovering = () => {
    //トリガーから外れても、popup上にマウスがあるなら閉じない
    if (hoveringPopup) return;
    setOpen(false);
    setAnchor(null);
    clearTimers();
  };


  //備考欄既読判定
  const remarksAcknowredged = async (task: Task) => {
    const isUnassigned = !task.manager;
    const isMyTask = task.manager === user?.name;

    if (!isUnassigned && !isMyTask) return; //他人のタスクはスキップ

    if (!user) return;

    const ackData = {
      task_id: task.id,
      acknowledged_by: user?.name,
      acknowledged_at: new Date(),
    }
    // console.log(ackData);
    const { error } = await supabase
      .from("tasks_acknowledgements")
      .upsert(ackData, {
        onConflict: "task_id,acknowledged_by"
      });

    if (error) console.error("確認フラグの登録に失敗しました。", error);

    upsertTaskAcknowledgement({
      task_id: task.id,
      acknowledged_by: user.name,
      acknowledged_at: new Date(),
    });
  }

  useEffect(() => {
    if (!isHoveringTrigger.current) return;

    const timer = setTimeout(() => {
      console.log("備考欄を表示しました。");
      remarksAcknowredged(task);
    }, 3000);

    return () => {
      clearTimeout(timer);
    }
  }, [isHoveringTrigger.current]);

  return (
    <>
      {/* ここが「備考」カプセル */}
      <button
        type="button"
        className={`
          ${className} grid place-content-center py-1 px-3 rounded-full text-xs transition-colors duration-200
          ${unread ? "bg-yellow-300/80 text-neutral-800 -outline-offset-2 outline-2 outline-yellow-300 font-bold" : "bg-neutral-500/60 text-neutral-50"}
        `}
        onMouseEnter={(e) => {
          isHoveringTrigger.current = true;
          //現在カーソル位置（ビューポート座標）
          const point = { x: e.clientX, y: e.clientY };
          scheduleOpen(point);
          handleHover(true);
        }}
        onMouseMove={(e) => {
          //開いてる間はカーソル追従させる
          if (!open) return;
          setAnchor({ x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => {
          isHoveringTrigger.current = false;
          //すぐ閉じず、popup側に入った可能性があるので少し待ってから判定
          window.setTimeout(() => closeIfNotHovering(), 0);
          handleHover(true);
        }}
        aria-label="備考を表示"
      >
        備考
      </button>

      <CursorHoverPopup
        open={open}
        anchor={anchor}
        onHoverChange={(h) => {
          setHoveringPopup(h);
          //popupから離れた瞬間、トリガーにも乗ってないなら閉じる
          if (!h && !isHoveringTrigger.current) {
            closeIfNotHovering();
          }
        }}
        className="rounded-xl bg-neutral-200 shadow-lg p-2 pt-1 text-sm text-neutral-900"
        maxWidth={520}
        maxHeight={1000}
      >
        <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600">
          <LuNotebookPen /> 備考
        </h3>
        {children}
      </CursorHoverPopup>
    </>
  );
}



