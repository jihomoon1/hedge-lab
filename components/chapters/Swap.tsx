"use client";
// Chapter 4. Dana's revenue against where oil settles: a diagonal line when
// unhedged, a flat line when fully swapped, and a slider that tilts between them.

import { useMemo, useState } from "react";
import { copy, fill } from "@/lib/copy";
import { DANA } from "@/lib/dana";
import { dollars, longDate, price } from "@/lib/format";
import type { CurveData } from "@/lib/market";
import { monthlyRevenue, swapMarkToMarket, swapRevenue } from "@/lib/pricing";
import Chapter from "../Chapter";
import ChartFrame from "../charts/ChartFrame";
import { LegendRow } from "../charts/parts";
import PayoffChart, { type PayoffLine, type PayoffRow } from "../charts/PayoffChart";
import { useMode } from "../ModeToggle";
import Slider from "../Slider";
import StatList from "../StatList";
import Term from "../Term";

type Props = {
  curve: CurveData;
  /** Today's front-month price, $/bbl */
  today: number;
};

export default function Swap({ curve, today }: Props) {
  const mode = useMode();
  const text = copy.swap[mode];
  const [hedgePct, setHedgePct] = useState(50);
  const h = hedgePct / 100;
  const strip = curve.strip;

  const values = {
    strip: price(strip),
    today: price(today),
    date: longDate(curve.asOf),
    hedged: `${hedgePct}%`,
    open: `${100 - hedgePct}%`,
    slope: (1 - h).toFixed(2),
    barrels: (h * DANA.volume).toLocaleString("en-US"),
    stripWeekAgo: curve.stripWeekAgo === null ? "" : price(curve.stripWeekAgo),
  };

  // One row every $5 from $20 to $130; every line here is straight.
  const rows: PayoffRow[] = useMemo(() => {
    const out: PayoffRow[] = [];
    for (let s = DANA.priceMin; s <= DANA.priceMax; s += 5) {
      out.push({
        s,
        unhedged: swapRevenue(0, strip, s),
        full: swapRevenue(1, strip, s),
        dana: swapRevenue(h, strip, s),
      });
    }
    return out;
  }, [h, strip]);

  const lines: PayoffLine[] = [
    { key: "unhedged", label: text.unhedged, color: "var(--crude)", dash: "7 5", width: 2 },
    {
      key: "full",
      label: fill(text.fullSwap, values),
      color: "var(--hedge)",
      dash: "2 4",
      width: 2,
    },
    { key: "dana", label: fill(text.dana, values), color: "var(--hedge)", width: 3.5 },
  ];

  const title = fill(
    hedgePct === 0 ? text.chartNone : hedgePct === 100 ? text.chartFull : text.chartPartial,
    values,
  );

  const chart = (
    <ChartFrame
      title={title}
      footnote={fill(text.footnote, values)}
      height="h-80 sm:h-[26rem]"
      legend={<LegendRow items={lines} />}
    >
      <PayoffChart
        rows={rows}
        lines={lines}
        mode={mode}
        xLabel={text.xLabel}
        yLabel={text.yLabel}
        markers={[{ x: today, label: fill(text.todayMark, values) }]}
      />
    </ChartFrame>
  );

  // Three "what if" prices: a crash, today's price, and a spike.
  const scenarios = [40, today, 120];
  const hedgedBarrels = h * DANA.volume;
  // Desk mode: suppose Dana locked in a week ago, at last week's strip. She
  // receives that fixed price, so the swap has gained if the strip has since fallen.
  const mtm =
    curve.stripWeekAgo === null
      ? null
      : swapMarkToMarket(curve.stripWeekAgo, strip, hedgedBarrels * 12);

  const controls = (
    <div className="space-y-5">
      <Slider
        label={text.sliderLabel}
        display={`${hedgePct}%`}
        value={hedgePct}
        min={0}
        max={100}
        step={5}
        onChange={setHedgePct}
        minLabel="0%"
        maxLabel="100%"
      />
      <table className="w-full text-sm">
        <caption className="pb-1 text-left text-sm font-medium text-muted">
          {text.tableTitle}
        </caption>
        <thead>
          <tr className="border-b border-rule text-muted">
            <th className="py-1.5 text-left font-normal">{text.tableScenario}</th>
            <th className="py-1.5 text-right font-normal">{text.tableUnhedged}</th>
            <th className="py-1.5 text-right font-normal">{text.tableHedged}</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s} className="border-b border-rule">
              <th className="num py-1.5 text-left font-normal">{price(s)}</th>
              <td className="num py-1.5 text-right">{dollars(monthlyRevenue(s, DANA.volume))}</td>
              <td className="num py-1.5 text-right font-semibold">
                {dollars(monthlyRevenue(swapRevenue(h, strip, s), DANA.volume))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {mode === "desk" && (
        <StatList
          stats={[
            {
              label: copy.swap.desk_stats.notional,
              value: fill(copy.swap.desk_stats.notionalValue, values),
            },
            ...(mtm === null
              ? []
              : [
                  {
                    label: (
                      <>
                        {fill(copy.swap.desk_stats.struck, values)}
                        {": "}
                        <Term k="markToMarket">{copy.swap.desk_stats.mtmLabel}</Term>
                      </>
                    ),
                    value: dollars(mtm),
                    note: fill(copy.swap.desk_stats.mtmMath, values),
                    tone: mtm < 0 ? ("loss" as const) : mtm > 0 ? ("gain" as const) : undefined,
                  },
                ]),
          ]}
        />
      )}
    </div>
  );

  return (
    <Chapter
      id="swap"
      kicker={text.kicker}
      title={fill(text.title, values)}
      chart={chart}
      controls={controls}
      body={text.body.map((paragraph) => fill(paragraph, values))}
      aha={text.aha}
    />
  );
}
