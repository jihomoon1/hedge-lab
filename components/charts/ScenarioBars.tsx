"use client";
// Chapter 9's stress test: for each of the four historical replays, a pair of
// bars showing 12 months of revenue without the hedge and with it.

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Mode } from "@/lib/copy";
import { compactDollars, dollars } from "@/lib/format";
import { axisLine, axisTick, TooltipBox } from "./parts";

export type ScenarioBar = {
  /** Short label under the bars, e.g. "2008" */
  tick: string;
  /** Full name for the hover box, e.g. "2008 crash" */
  name: string;
  /** A line of context for the hover box, e.g. the path's price range */
  detail: string;
  unhedged: number;
  hedged: number;
};

type Props = {
  bars: ScenarioBar[];
  mode: Mode;
  labels: { unhedged: string; hedged: string; diff: string; y: string };
};

type HoverProps = { active?: boolean; payload?: readonly { payload?: ScenarioBar }[] };

/** The id of the striped fill used for the "no hedge" bars. */
const HATCH = "scenario-unhedged-hatch";

/**
 * The legend for the bars. The unhedged bars are striped and the hedged
 * bars solid, so the two are told apart by pattern as well as by color.
 */
export function BarLegend({ unhedged, hedged }: { unhedged: string; hedged: string }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink">
      <li className="flex items-center gap-2">
        <svg width="16" height="12" aria-hidden>
          <defs>
            <pattern
              id={`${HATCH}-key`}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--crude)" strokeWidth="3.5" />
            </pattern>
          </defs>
          <rect
            width="16"
            height="12"
            rx="2"
            fill={`url(#${HATCH}-key)`}
            stroke="var(--crude)"
            strokeWidth="1"
          />
        </svg>
        {unhedged}
      </li>
      <li className="flex items-center gap-2">
        <svg width="16" height="12" aria-hidden>
          <rect width="16" height="12" rx="2" fill="var(--hedge)" />
        </svg>
        {hedged}
      </li>
    </ul>
  );
}

export default function ScenarioBars({ bars, mode, labels }: Props) {
  const hover = ({ active, payload }: HoverProps) => {
    const bar = payload?.[0]?.payload;
    if (!active || !bar) return null;
    return (
      <TooltipBox
        title={`${bar.name}. ${bar.detail}`}
        rows={[
          [labels.unhedged, dollars(bar.unhedged)],
          [labels.hedged, dollars(bar.hedged)],
          [labels.diff, dollars(bar.hedged - bar.unhedged)],
        ]}
      />
    );
  };

  return (
    <div className="flex h-full flex-col">
      <p className="text-xs text-muted">{labels.y}</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={bars}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barGap={2}
            barCategoryGap="22%"
          >
            <defs>
              <pattern
                id={HATCH}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--crude)" strokeWidth="4" />
              </pattern>
            </defs>
            <CartesianGrid stroke="var(--rule)" vertical={false} />
            <XAxis dataKey="tick" tick={axisTick} axisLine={axisLine} tickLine={false} />
            <YAxis
              width={54}
              tickFormatter={compactDollars}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={0} stroke="var(--muted)" />
            <Tooltip content={hover} cursor={{ fill: "var(--rule)", fillOpacity: 0.4 }} />
            <Bar
              dataKey="unhedged"
              fill={`url(#${HATCH})`}
              stroke="var(--crude)"
              strokeWidth={mode === "desk" ? 1 : 1.25}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="hedged"
              fill="var(--hedge)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
