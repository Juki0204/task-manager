"use client";

import React, { useEffect, useRef, useState } from "react";
import { CursorHoverPopup } from "./CursorHoverPopup";
import { LuNotebookPen } from "react-icons/lu";

type RemarksHoverProps = {
  // isUnread: boolean;
  children: React.ReactNode;
  handleHover: (hover: boolean) => void;
  onMarkRead?: () => void;
  openDelayMs?: number;
  readAfterMs?: number;
  className?: string;
};

export function RemarksHoverMark({
  // isUnread,
  children,
  onMarkRead,
  handleHover,
  openDelayMs = 200,
  readAfterMs = 3000,
  className,
}: RemarksHoverProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [hoveringPopup, setHoveringPopup] = useState(false);

  const openTimer = useRef<number | null>(null);
  const readTimer = useRef<number | null>(null);
  const isHoveringTrigger = useRef(false);
  const hasMarkedRead = useRef(false);

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

      //未読なら、表示継続で既読化タイマーを開始
      // if (isUnread && !hasMarkedRead.current && onMarkRead) {
      //   readTimer.current = window.setTimeout(() => {
      //     // 「表示されていて」かつ「トリガー or popupのどちらかにhover中」なら既読化
      //     const stillHovering = isHoveringTrigger.current || hoveringPopup;
      //     if (!stillHovering) return;
      //     hasMarkedRead.current = true;
      //     onMarkRead();
      //   }, readAfterMs);
      // }
    }, openDelayMs);
  };

  const closeIfNotHovering = () => {
    //トリガーから外れても、popup上にマウスがあるなら閉じない
    if (hoveringPopup) return;
    setOpen(false);
    setAnchor(null);
    clearTimers();
  };

  return (
    <>
      {/* ここが「備考」カプセル */}
      <button
        type="button"
        className={`
          ${className} grid place-content-center py-1 px-3 rounded-full text-xs transition-colors duration-200 bg-neutral-500/60 text-neutral-50",
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
      >
        <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm text-neutral-600">
          <LuNotebookPen /> 備考
        </h3>
        {children}
      </CursorHoverPopup>
    </>
  );
}


