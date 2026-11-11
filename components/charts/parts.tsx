"use client";
// Small pieces the charts share: axis styling, a legend row that shows each
// line's dash style next to its label, and the hover box.

import type { ReactNode } from "react";

/** Axis text and line styling, quiet enough to stay behind the data. */
export const axisTick = { fill: "var(--muted)", fontSize: 12 };
export const axisLine = { stroke: "var(--rule)" };

export type LegendItem = {
  label: string;
  color: string;
  /** SVG dash pattern, e.g. "6 4". Leave out for a solid line. */
  dash?: string;
  width?: number;
  opacity?: number;
};

/** A legend that repeats each line's dash pattern, so color is never the only cue. */
export function LegendRow({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <svg width="28" height="10" aria-hidden>
            <line
              x1="1"
              x2="27"
              y1="5"
              y2="5"
              stroke={item.color}
              strokeWidth={item.width ?? 2}
              strokeDasharray={item.dash}
              strokeOpacity={item.opacity ?? 1}
              strokeLinecap="round"
            />
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** The box that appears next to the cursor when hovering a chart. */
export function TooltipBox({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <div className="rounded border border-rule bg-paper px-2.5 py-1.5 text-sm shadow-sm">
      <div className="text-muted">{title}</div>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <span className="text-muted">{label}</span>
          <span className="num font-medium text-ink">{value}</span>
        </div>
      ))}
    </div>
  );
}
