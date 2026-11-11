"use client";
// A payoff chart: what Dana receives per barrel (up the side) against where
// oil ends up (along the bottom). Each line gets its own dash style, and the
// chart can mark strikes, shade a zone and follow a moving price.

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Mode } from "@/lib/copy";
import { compactDollars, dollars, price } from "@/lib/format";
import { axisLine, axisTick, TooltipBox } from "./parts";

export type PayoffLine = {
  /** Which field of each row this line plots */
  key: string;
  label: string;
  color: string;
  /** SVG dash pattern; leave out for a solid line */
  dash?: string;
  /** Line width in Plain mode (Desk mode draws thinner) */
  width?: number;
  opacity?: number;
};

/** One row per oil price `s`, with one number per line key. */
export type PayoffRow = { s: number } & Record<string, number>;

/** A vertical marker with a short label, e.g. a strike or today's price. */
export type PayoffMarker = {
  x: number;
  label: string;
  strong?: boolean;
  /** Which label row to use (0 is lowest). Left out, rows alternate 0 and 1. */
  row?: number;
};

/** A shaded band between two oil prices, with a label inside it. */
export type PayoffZone = { from: number; to: number; label: string };

type Props = {
  rows: PayoffRow[];
  lines: PayoffLine[];
  mode: Mode;
  xLabel: string;
  yLabel: string;
  markers?: PayoffMarker[];
  zone?: PayoffZone;
  /**
   * Set when the lines are dollar totals (e.g. revenue per month) instead of
   * $ per barrel: the side axis then scales to the data and reads $800k, $1.2M.
   */
  money?: boolean;
};

/** Evenly spaced round numbers covering min to max, about five of them. */
function roundTicks(min: number, max: number): number[] {
  const rough = (max - min || 1) / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? rough;
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; v < max + step; v += step) ticks.push(v);
  return ticks;
}

type HoverProps = { active?: boolean; payload?: readonly { payload?: PayoffRow }[] };

/**
 * Builds the list of oil prices a payoff chart needs: one every $5, plus the
 * exact strikes, so the corners of each line land exactly on its strike.
 */
export function payoffGrid(min: number, max: number, corners: number[] = []): number[] {
  const points = new Set<number>();
  for (let s = min; s <= max; s += 5) points.add(s);
  points.add(max);
  for (const corner of corners) if (corner > min && corner < max) points.add(corner);
  return [...points].sort((a, b) => a - b);
}

export default function PayoffChart({
  rows,
  lines,
  mode,
  xLabel,
  yLabel,
  markers,
  zone,
  money,
}: Props) {
  const desk = mode === "desk";
  // Lines draw in once when the chart first appears; after that they follow
  // the sliders instantly, with no animation to lag behind the thumb.
  const [drawn, setDrawn] = useState(false);

  const xMin = rows[0].s;
  const xMax = rows[rows.length - 1].s;
  const xTicks: number[] = [];
  for (let v = Math.ceil(xMin / 20) * 20; v <= xMax; v += 20) xTicks.push(v);

  const values = rows.flatMap((row) => lines.map((line) => row[line.key]));
  let yMin = Math.min(xMin, Math.floor(Math.min(...values) / 10) * 10);
  let yMax = Math.max(xMax, Math.ceil(Math.max(...values) / 10) * 10);
  let yTicks: number[] = [];
  if (money) {
    yTicks = roundTicks(Math.min(...values), Math.max(...values));
    yMin = yTicks[0];
    yMax = yTicks[yTicks.length - 1];
  } else {
    for (let v = Math.ceil(yMin / 20) * 20; v <= yMax; v += 20) yTicks.push(v);
  }
  const showValue = money ? dollars : price;

  const hover = ({ active, payload }: HoverProps) => {
    const row = payload?.[0]?.payload;
    if (!active || !row) return null;
    return (
      <TooltipBox
        title={`${xLabel}: ${price(row.s)}`}
        rows={lines.map((line) => [line.label, showValue(row[line.key])])}
      />
    );
  };

  // Marker labels sit on alternating rows, left to right, so neighbours
  // don't collide. A marker with its own `row` keeps to that row.
  const placedMarkers = [...(markers ?? [])]
    .sort((a, b) => a.x - b.x)
    .map((marker, i) => ({ ...marker, row: marker.row ?? i % 2 }));
  const topMargin = 22 + 15 * Math.max(0, ...placedMarkers.map((m) => m.row));

  return (
    <div className="flex h-full flex-col">
      <p className="text-xs text-muted">{yLabel}</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: topMargin, right: 14, bottom: 0, left: 0 }}>
            {desk && <CartesianGrid stroke="var(--rule)" />}
            <XAxis
              dataKey="s"
              type="number"
              domain={[xMin, xMax]}
              ticks={xTicks}
              tickFormatter={(v: number) => `$${v}`}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
            />
            <YAxis
              width={money ? 54 : 46}
              domain={[yMin, yMax]}
              ticks={yTicks}
              tickFormatter={(v: number) => (money ? compactDollars(v) : `$${v}`)}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            />
            {zone && zone.to > zone.from && (
              <ReferenceArea
                x1={zone.from}
                x2={zone.to}
                fill="var(--loss)"
                fillOpacity={0.14}
                stroke="none"
                label={{
                  value: zone.label,
                  position: "insideBottom",
                  fill: "var(--loss)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            )}
            {placedMarkers.map((marker, i) => (
              <ReferenceLine
                key={`${marker.label}-${i}`}
                x={marker.x}
                stroke={marker.strong ? "var(--ink)" : "var(--muted)"}
                strokeWidth={marker.strong ? 1.5 : 1}
                strokeDasharray={marker.strong ? undefined : "2 3"}
                label={{
                  value: marker.label,
                  position: "top",
                  dy: -15 * marker.row,
                  fill: marker.strong ? "var(--ink)" : "var(--muted)",
                  fontSize: 12,
                  fontWeight: marker.strong ? 600 : 400,
                }}
              />
            ))}
            <Tooltip content={hover} cursor={{ stroke: "var(--muted)", strokeWidth: 1 }} />
            {lines.map((line, i) => (
              <Line
                key={line.key}
                dataKey={line.key}
                type="linear"
                stroke={line.color}
                strokeWidth={desk ? Math.max(1, (line.width ?? 2) - 1) : (line.width ?? 2)}
                strokeDasharray={line.dash}
                strokeOpacity={line.opacity ?? 1}
                dot={false}
                activeDot={{ r: 4, stroke: "var(--paper)", strokeWidth: 2 }}
                isAnimationActive={!drawn}
                animationDuration={500}
                onAnimationEnd={i === 0 ? () => setDrawn(true) : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-xs text-muted">{xLabel}</p>
    </div>
  );
}
