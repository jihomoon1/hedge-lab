"use client";
// Chapter 8, Desk mode: three years of implied vol (OVX) and realized vol on
// one axis, with the gap between the two lines lightly shaded.

import { useReducedMotion } from "framer-motion";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate } from "@/lib/format";
import { axisLine, axisTick, TooltipBox } from "./parts";

export type VolRow = {
  /** Date as a timestamp, for the time axis */
  t: number;
  d: string;
  iv: number;
  rv: number;
  /** [lower, upper] of the two, which the shaded band fills */
  band: [number, number];
};

type Props = {
  rows: VolRow[];
  labels: { iv: string; rv: string; gap: string; y: string };
};

type HoverProps = { active?: boolean; payload?: readonly { payload?: VolRow }[] };

export default function VolSpreadChart({ rows, labels }: Props) {
  const reduceMotion = useReducedMotion();
  // One tick at the start of each calendar year inside the window.
  const firstYear = new Date(rows[0].t).getUTCFullYear() + 1;
  const lastYear = new Date(rows[rows.length - 1].t).getUTCFullYear();
  const yearTicks: number[] = [];
  for (let year = firstYear; year <= lastYear; year++) yearTicks.push(Date.UTC(year, 0, 1));

  const hover = ({ active, payload }: HoverProps) => {
    const row = payload?.[0]?.payload;
    if (!active || !row) return null;
    const gap = row.iv - row.rv;
    return (
      <TooltipBox
        title={shortDate(row.d)}
        rows={[
          [labels.iv, row.iv.toFixed(1)],
          [labels.rv, row.rv.toFixed(1)],
          [labels.gap, `${gap < 0 ? "−" : "+"}${Math.abs(gap).toFixed(1)}`],
        ]}
      />
    );
  };

  return (
    <div className="flex h-full flex-col">
      <p className="text-xs text-muted">{labels.y}</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 14, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--rule)" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={yearTicks}
              tickFormatter={(t: number) => String(new Date(t).getUTCFullYear())}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
            />
            <YAxis
              width={40}
              domain={[0, "auto"]}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={hover} cursor={{ stroke: "var(--muted)", strokeWidth: 1 }} />
            <Area
              dataKey="band"
              type="linear"
              stroke="none"
              fill="var(--muted)"
              fillOpacity={0.22}
              isAnimationActive={false}
              activeDot={false}
            />
            <Line
              dataKey="rv"
              type="linear"
              stroke="var(--hedge)"
              strokeWidth={1.25}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 3, stroke: "var(--paper)", strokeWidth: 2 }}
              isAnimationActive={!reduceMotion}
              animationDuration={600}
            />
            <Line
              dataKey="iv"
              type="linear"
              stroke="var(--crude)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, stroke: "var(--paper)", strokeWidth: 2 }}
              isAnimationActive={!reduceMotion}
              animationDuration={600}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
