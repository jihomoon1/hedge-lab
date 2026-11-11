"use client";
// A payoff chart: what Dana receives per barrel (up the side) against where
// oil ends up (along the bottom). Each line gets its own dash style.

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Mode } from "@/lib/copy";
import { price } from "@/lib/format";
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

type Props = {
  rows: PayoffRow[];
  lines: PayoffLine[];
  mode: Mode;
  xLabel: string;
  yLabel: string;
  /** A vertical marker, e.g. today's price */
  marker?: { x: number; label: string };
};

type HoverProps = { active?: boolean; payload?: readonly { payload?: PayoffRow }[] };

export default function PayoffChart({ rows, lines, mode, xLabel, yLabel, marker }: Props) {
  const desk = mode === "desk";
  const xMin = rows[0].s;
  const xMax = rows[rows.length - 1].s;
  const ticks: number[] = [];
  for (let v = Math.ceil(xMin / 20) * 20; v <= xMax; v += 20) ticks.push(v);

  const hover = ({ active, payload }: HoverProps) => {
    const row = payload?.[0]?.payload;
    if (!active || !row) return null;
    return (
      <TooltipBox
        title={`${xLabel}: ${price(row.s)}`}
        rows={lines.map((line) => [line.label, price(row[line.key])])}
      />
    );
  };

  return (
    <div className="flex h-full flex-col">
      <p className="text-xs text-muted">{yLabel}</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 18, right: 14, bottom: 0, left: 0 }}>
            {desk && <CartesianGrid stroke="var(--rule)" />}
            <XAxis
              dataKey="s"
              type="number"
              domain={[xMin, xMax]}
              ticks={ticks}
              tickFormatter={(v: number) => `$${v}`}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
            />
            <YAxis
              width={46}
              domain={[xMin, xMax]}
              ticks={ticks}
              tickFormatter={(v: number) => `$${v}`}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            />
            {marker && (
              <ReferenceLine
                x={marker.x}
                stroke="var(--muted)"
                strokeWidth={1}
                strokeDasharray="2 3"
                label={{
                  value: marker.label,
                  position: "top",
                  fill: "var(--muted)",
                  fontSize: 12,
                }}
              />
            )}
            <Tooltip content={hover} cursor={{ stroke: "var(--muted)", strokeWidth: 1 }} />
            {lines.map((line) => (
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
                animationDuration={250}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-xs text-muted">{xLabel}</p>
    </div>
  );
}
