"use client";
// The long price-history chart: daily WTI since 2007 with numbered pins, a
// "curtain" that slides away to draw the line, and (in Desk mode) a second
// panel underneath with 30-day realized vol on its own axis.

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Mode } from "@/lib/copy";
import { pct, price, shortDate } from "@/lib/format";
import { axisLine, axisTick, TooltipBox } from "./parts";

export type HistoryRow = {
  /** Date as a timestamp, for the time axis */
  t: number;
  /** Date as "YYYY-MM-DD" */
  d: string;
  /** Spot price, $/bbl */
  p: number;
  /** 30-day realized vol as a decimal, or null */
  rv: number | null;
};

export type Pin = { n: number; t: number; p: number };

type Props = {
  rows: HistoryRow[];
  pins: Pin[];
  mode: Mode;
  /** Changes each time Play is pressed; 0 means "just scrolled into view". */
  playToken: number;
  playing: boolean;
  onPlayEnd: () => void;
  labels: { price: string; vol: string; through: string };
};

// Both panels use the same left axis width and right margin so their time
// axes line up, and so the curtain knows where the plot area starts.
const AXIS_WIDTH = 46;
const RIGHT_MARGIN = 14;
const MARGIN = { top: 14, right: RIGHT_MARGIN, bottom: 0, left: 0 };
const SYNC_ID = "price-history";

function PinShape({ cx, cy, n }: { cx?: number; cy?: number; n: number }) {
  if (cx === undefined || cy === undefined) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
      <text
        x={cx}
        y={cy}
        dy="0.36em"
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
        fill="var(--ink)"
      >
        {n}
      </text>
    </g>
  );
}

type HoverProps = { active?: boolean; payload?: readonly { payload?: HistoryRow }[] };

export default function PriceHistory({
  rows,
  pins,
  mode,
  playToken,
  playing,
  onPlayEnd,
  labels,
}: Props) {
  const reduceMotion = useReducedMotion();
  const desk = mode === "desk";

  // progress runs 0 → 1; the curtain covers everything to the right of it.
  const progress = useMotionValue(0);
  const curtainLeft = useTransform(
    progress,
    (p) => `calc(${AXIS_WIDTH}px + (100% - ${AXIS_WIDTH + RIGHT_MARGIN}px) * ${p})`,
  );
  const curtainDisplay = useTransform(progress, (p) => (p >= 1 ? "none" : "block"));
  const yearShown = useTransform(progress, (p) => {
    const index = Math.min(rows.length - 1, Math.floor(p * (rows.length - 1)));
    return labels.through.replace("{year}", rows[index].d.slice(0, 4));
  });

  useEffect(() => {
    if (reduceMotion) {
      progress.set(1);
      onPlayEnd();
      return;
    }
    progress.set(0);
    const controls = animate(progress, 1, {
      // A quick draw-in on arrival; a slow, watchable run when Play is pressed.
      duration: playToken === 0 ? 1.8 : 12,
      ease: playToken === 0 ? "easeOut" : "linear",
      onComplete: onPlayEnd,
    });
    return () => controls.stop();
    // onPlayEnd is left out on purpose: only a new Play press restarts the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken, reduceMotion, progress]);

  const first = rows[0];
  const last = rows[rows.length - 1];
  const domain: [number, number] = [first.t, last.t];

  // A tick every four years, starting from the first full leap-year boundary.
  const yearTicks: number[] = [];
  for (let y = Number(first.d.slice(0, 4)) + 1; y <= Number(last.d.slice(0, 4)); y++) {
    if (y % 4 === 0) yearTicks.push(Date.UTC(y, 0, 1));
  }
  const formatYear = (t: number) => String(new Date(t).getUTCFullYear());

  const prices = rows.map((r) => r.p);
  const yMin = Math.floor(Math.min(...prices) / 40) * 40;
  const yMax = Math.ceil(Math.max(...prices) / 40) * 40;
  const priceTicks: number[] = [];
  for (let v = yMin; v <= yMax; v += 40) priceTicks.push(v);

  const rvTop = Math.ceil(Math.max(...rows.map((r) => r.rv ?? 0)));
  const rvTicks = Array.from({ length: rvTop + 1 }, (_, i) => i);

  const hover = ({ active, payload }: HoverProps) => {
    const row = payload?.[0]?.payload;
    if (!active || !row) return null;
    const lines: [string, string][] = [[labels.price, price(row.p)]];
    if (desk && row.rv !== null) lines.push([labels.vol, pct(row.rv)]);
    return <TooltipBox title={shortDate(row.d)} rows={lines} />;
  };

  const timeAxis = (hidden: boolean) => (
    <XAxis
      dataKey="t"
      type="number"
      scale="time"
      domain={domain}
      ticks={yearTicks}
      tickFormatter={formatYear}
      tick={axisTick}
      axisLine={axisLine}
      tickLine={false}
      hide={hidden}
    />
  );

  return (
    <div className="relative flex h-full flex-col">
      <div className={desk ? "min-h-0 flex-[3]" : "min-h-0 flex-1"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            // In Desk mode this panel has no time axis under it, so it needs
            // room at the bottom for the lowest pin and axis label.
            margin={desk ? { ...MARGIN, bottom: 14 } : MARGIN}
            syncId={SYNC_ID}
          >
            {desk && <CartesianGrid stroke="var(--rule)" vertical={false} />}
            {timeAxis(desk)}
            <YAxis
              width={AXIS_WIDTH}
              domain={[yMin, yMax]}
              ticks={priceTicks}
              tickFormatter={(v: number) => (v < 0 ? `−$${-v}` : `$${v}`)}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={0} stroke="var(--muted)" strokeWidth={1} />
            <Tooltip content={hover} cursor={{ stroke: "var(--muted)", strokeWidth: 1 }} />
            <Line
              dataKey="p"
              stroke="var(--crude)"
              strokeWidth={desk ? 1 : 1.75}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--paper)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {pins.map((pin) => (
              <ReferenceDot
                key={pin.n}
                x={pin.t}
                y={pin.p}
                shape={(props: { cx?: number; cy?: number }) => (
                  <PinShape cx={props.cx} cy={props.cy} n={pin.n} />
                )}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {desk && (
        <>
          <p className="mt-2 pl-[46px] font-mono text-xs text-muted">{labels.vol}</p>
          <div className="min-h-0 flex-[1.5]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ ...MARGIN, top: 4 }} syncId={SYNC_ID}>
                <CartesianGrid stroke="var(--rule)" vertical={false} />
                {timeAxis(false)}
                <YAxis
                  width={AXIS_WIDTH}
                  domain={[0, rvTop]}
                  ticks={rvTicks}
                  tickFormatter={(v: number) => `${v * 100}%`}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                />
                {/* The top panel's box already shows the value; this one only
                    draws the matching vertical cursor line. */}
                <Tooltip
                  content={() => null}
                  cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
                />
                <Line
                  dataKey="rv"
                  stroke="var(--ink)"
                  strokeWidth={1}
                  dot={false}
                  activeDot={{ r: 3, stroke: "var(--paper)", strokeWidth: 2 }}
                  isAnimationActive={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* The curtain: a paper-colored cover that slides right to reveal the line. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 bg-paper"
        style={{ left: curtainLeft, display: curtainDisplay }}
      />
      {playing && (
        <motion.p
          aria-hidden
          className="num absolute top-0 right-0 rounded border border-rule bg-paper px-2 py-0.5 text-sm text-ink"
        >
          {yearShown}
        </motion.p>
      )}
    </div>
  );
}
