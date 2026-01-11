"use client";

import React, { useMemo, useState } from "react";

type Segment = {
  key: string;        // "未着手" など
  value: number;      // 件数
  color: string;      // "#..." or "rgb(...)"
};

type DonutChartProps = {
  segments: Segment[];     // 4項目想定（任意の数でもOK）
  size?: number;           // default 300
  thickness?: number;      // ドーナツの太さ（default 32）
  gapDeg?: number;         // セグメント間の隙間角度（default 0.8）
  title?: string;          // 中央ラベル（default "今月の依頼"）
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180; // -90で12時スタート
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

/**
 * SVGのドーナツ（リング）を「扇形のパス」として描く
 * start/end は度数（0〜360）で、時計回りに増える
 */
function describeDonutArc(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
) {
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const p1 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p3 = polarToCartesian(cx, cy, rInner, startAngle);
  const p4 = polarToCartesian(cx, cy, rInner, endAngle);

  return [
    `M ${p2.x} ${p2.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${p1.x} ${p1.y}`,
    `L ${p4.x} ${p4.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

export function RequestGraph({
  segments,
  size = 300,
  thickness = 32,
  gapDeg = 0,
  title = "今月の依頼",
  className,
}: DonutChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const safeSize = clamp(size, 160, 800);
  const center = safeSize / 2;

  // 半径設計
  const rOuter = center - 6;
  const rInner = rOuter - clamp(thickness, 14, rOuter - 20);

  const total = useMemo(
    () => segments.reduce((sum, s) => sum + (Number.isFinite(s.value) ? s.value : 0), 0),
    [segments]
  );

  const paths = useMemo(() => {
    if (total <= 0) return [];

    let currentAngle = 0;
    const result: Array<{
      key: string;
      d: string;
      color: string;
      midAngle: number;
      value: number;
    }> = [];

    for (const s of segments) {
      const value = Math.max(0, s.value);
      const rawSweep = (value / total) * 360;
      const sweep = Math.max(0, rawSweep - gapDeg);
      const start = currentAngle + gapDeg / 2;
      const end = start + sweep;

      if (sweep > 0.001) {
        const d = describeDonutArc(center, center, rOuter, rInner, start, end);
        result.push({
          key: s.key,
          d,
          color: s.color,
          midAngle: start + sweep / 2,
          value: s.value,
        });
      }

      currentAngle += rawSweep;
    }

    return result;
  }, [segments, total, center, rOuter, rInner, gapDeg]);

  const hovered = segments.find((s) => s.key === hoveredKey) ?? null;

  return (
    <div className={className} style={{ width: safeSize, height: safeSize, position: "relative" }}>
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -110%)",
            pointerEvents: "none",
            padding: "6px 10px",
            borderRadius: 10,
            fontSize: 12,
            lineHeight: 1.2,
            background: "rgba(15, 23, 42, 0.92)",
            color: "white",
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.text}
        </div>
      )}

      <svg width={safeSize} height={safeSize} viewBox={`0 0 ${safeSize} ${safeSize}`}>
        {/* 背景リング（total=0の時の見た目にも） */}
        <circle
          cx={center}
          cy={center}
          r={(rOuter + rInner) / 2}
          fill="none"
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth={rOuter - rInner}
        />

        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill={p.color}
            opacity={hoveredKey && hoveredKey !== p.key ? 0.35 : 1}
            onMouseEnter={(e) => {
              setHoveredKey(p.key);

              // tooltip位置：セグメントの中央あたりに出す
              const point = polarToCartesian(center, center, (rOuter + rInner) / 2, p.midAngle);
              const rect = (e.currentTarget.ownerSVGElement?.getBoundingClientRect());
              const wrap = (e.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect());
              // 絶対位置計算（svgの親div基準）
              if (rect && wrap) {
                const x = point.x * (rect.width / safeSize) + (rect.left - wrap.left);
                const y = point.y * (rect.height / safeSize) + (rect.top - wrap.top);
                setTooltip({ x, y, text: `${p.key}：${p.value}件` });
              } else {
                setTooltip(null);
              }
            }}
            onMouseLeave={() => {
              setHoveredKey(null);
              setTooltip(null);
            }}
          />
        ))}

        {/* 中央の白抜き */}
        <circle cx={center} cy={center} r={rInner - 2} fill="transparent" />
      </svg>

      {/* 中央ラベル */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          pointerEvents: "none",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>
          {total}<span className="text-base">件</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8, lineHeight: 1 }} className="font-bold">
          {title}
        </div>

        {/* hover中だけ中央に補助表示 */}
        {/* {hovered && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            {hovered.key}：{hovered.value}件
          </div>
        )} */}
      </div>
    </div>
  );
}
