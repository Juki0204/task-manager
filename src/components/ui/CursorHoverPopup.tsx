"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Point = { x: number; y: number };

type CursorHoverPopupProps = {
  open: boolean;
  anchor: Point | null; // viewport座標（固定）
  children: React.ReactNode;
  className?: string;

  margin?: number;
  offset?: { x: number; y: number };
  maxWidth?: number;
  maxHeight?: number;
  zIndex?: number;

  onHoverChange?: (hovering: boolean) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function CursorHoverPopup({
  open,
  anchor,
  children,
  className,
  margin = 12,
  offset = { x: 16, y: 16 },
  maxWidth = 520,
  maxHeight = 360,
  zIndex = 80,
  onHoverChange
}: CursorHoverPopupProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => setMounted(true), []);

  //表示位置計算（画面端を考慮して計算）
  useEffect(() => {
    if (!open || !anchor) {
      setPos(null);
      setReady(false);
      return;
    }
    if (!ref.current) return;

    const id = requestAnimationFrame(() => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let left = anchor.x + offset.x;
      let top = anchor.y + offset.y;

      // 右/下にはみ出すなら反転
      if (left + rect.width + margin > vw) left = anchor.x - rect.width - offset.x;
      if (top + rect.height + margin > vh) top = anchor.y - rect.height - offset.y;

      // 最終クランプ
      left = clamp(left, margin, vw - rect.width - margin);
      top = clamp(top, margin, vh - rect.height - margin);

      setPos({ left, top });
      setReady(true);
    });

    return () => cancelAnimationFrame(id);
  }, [open, anchor, offset.x, offset.y, margin, children]);

  //ポップアップのポジション決定
  const style = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex,
      maxWidth,
      maxHeight,
      transform: "translate3d(0,0,0)",
      willChange: "left, top, opacity",
    };

    if (!pos) {
      return {
        ...base,
        left: 0,
        top: 0,
        opacity: 0,
        pointerEvents: "none",
      };
    }

    return {
      ...base,
      left: pos.left,
      top: pos.top,
      opacity: ready ? 1 : 0,
      pointerEvents: ready ? "auto" : "none",
    };
  }, [pos, ready, zIndex, maxWidth, maxHeight]);

  if (!mounted || !open || !anchor) return null;

  return createPortal(
    <div
      ref={ref}
      style={style}
      className={
        className ??
        "rounded-xl border border-neutral-200 bg-white shadow-lg p-3 text-sm text-neutral-900"
      }
      role="tooltip"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div className="max-h-[inherit] overflow-auto whitespace-pre-wrap break-words">
        {children}
      </div>
    </div>,
    document.body
  );
}
