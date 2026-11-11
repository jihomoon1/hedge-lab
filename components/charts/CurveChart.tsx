"use client";
// The futures curve: today's 12 contract prices as a solid line with dots,
// and the curve from a week earlier as a faded, dashed "ghost" line.

import { useReducedMotion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Mode } from "@/lib/copy";
import { monthShort, monthYear, price } from "@/lib/format";
import { axisLine, axisTick, TooltipBox } from "./parts";

type Point = { month: string; ticker: string; price: number; weekAgo: number | null };

type Props = {
  points: Point[];
  mode: Mode;
  labels: { price: string; weekAgo: string };
};

type HoverProps = { active?: boolean; payload?: readonly { payload?: Point }[] };

/** The ghost line's look, shared with the legend in the Curve chapter. */
export const GHOST_DASH = "5 4";

export default function CurveChart({ points, mode, labels }: Props) {
  const reduceMotion = useReducedMotion();
  const desk = mode === "desk";

  const all = points.flatMap((p) => (p.weekAgo === null ? [p.price] : [p.price, p.weekAgo]));
  // Round the axis out to even steps of $5 (or $10 when the range is wide).
  const step = Math.max(...all) - Math.min(...all) > 25 ? 10 : 5;
  const yMin = Math.floor((Math.min(...all) - 1) / step) * step;
  const yMax = Math.ceil((Math.max(...all) + 1) / step) * step;
  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax; v += step) yTicks.push(v);

  // "Dec", "Jan ’27", "Feb" ...: the year appears on the first tick and each January.
  const tickLabel = (month: string, index: number) =>
    index === 0 || month.endsWith("-01")
      ? `${monthShort(month)} ’${month.slice(2, 4)}`
      : monthShort(month);

  const hover = ({ active, payload }: HoverProps) => {
    const point = payload?.[0]?.payload;
    if (!active || !point) return null;
    const rows: [string, string][] = [[labels.price, price(point.price)]];
    if (point.weekAgo !== null) rows.push([labels.weekAgo, price(point.weekAgo)]);
    return (
      <TooltipBox
        title={desk ? `${point.ticker} · ${monthYear(point.month)}` : monthYear(point.month)}
        rows={rows}
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 10, right: 14, bottom: 0, left: 0 }}>
        {desk && <CartesianGrid stroke="var(--rule)" vertical={false} />}
        <XAxis
          dataKey="month"
          tickFormatter={tickLabel}
          tick={axisTick}
          axisLine={axisLine}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={12}
        />
        <YAxis
          width={46}
          domain={[yMin, yMax]}
          ticks={yTicks}
          tickFormatter={(v: number) => `$${v}`}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={hover} cursor={{ stroke: "var(--muted)", strokeWidth: 1 }} />
        <Line
          dataKey="weekAgo"
          stroke="var(--muted)"
          strokeOpacity={0.75}
          strokeWidth={desk ? 1 : 2}
          strokeDasharray={GHOST_DASH}
          dot={false}
          activeDot={false}
          isAnimationActive={!reduceMotion}
          animationDuration={900}
        />
        <Line
          dataKey="price"
          stroke="var(--crude)"
          strokeWidth={desk ? 1.5 : 3}
          dot={{ r: desk ? 3 : 4, fill: "var(--crude)", stroke: "var(--paper)", strokeWidth: 2 }}
          activeDot={{ r: 6, stroke: "var(--paper)", strokeWidth: 2 }}
          isAnimationActive={!reduceMotion}
          animationDuration={1200}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
