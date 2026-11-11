"use client";
// Chapter 3. The next 12 months of futures prices as a curve, last week's
// curve as a ghost line, and a storage tank that fills or drains with the slope.

import { copy, fill } from "@/lib/copy";
import { longDate, monthYear, price, signedPct, signedPrice } from "@/lib/format";
import type { CurveData } from "@/lib/market";
import Chapter from "../Chapter";
import ChartFrame from "../charts/ChartFrame";
import CurveChart, { GHOST_DASH } from "../charts/CurveChart";
import { LegendRow } from "../charts/parts";
import StorageTank from "../charts/StorageTank";
import { useMode } from "../ModeToggle";
import StatList from "../StatList";

export default function Curve({ data }: { data: CurveData }) {
  const mode = useMode();
  const text = copy.curve[mode];
  const first = data.points[0];
  const last = data.points[data.points.length - 1];

  const values = {
    date: longDate(data.asOf),
    m1: price(data.m1),
    m12: price(data.m12),
    m1Month: monthYear(first.month),
    m12Month: monthYear(last.month),
    gap: price(Math.abs(data.spread)),
    spread: signedPrice(data.spread),
    rollYield: signedPct(data.rollYield),
    strip: price(data.strip),
  };

  // The sentence and title are picked by what the data says today.
  const byShape = {
    contango: { sentence: text.contango, title: text.chartContango, tank: text.tankFilling },
    backwardation: {
      sentence: text.backwardation,
      title: text.chartBackwardation,
      tank: text.tankDraining,
    },
    flat: { sentence: text.flat, title: text.chartFlat, tank: text.tankFlat },
  }[data.shape];

  const hasGhost = data.points.some((p) => p.weekAgo !== null);
  const legend = (
    <div className="flex items-center justify-between gap-4">
      <LegendRow
        items={[
          { label: fill(text.today, values), color: "var(--crude)", width: 3 },
          ...(hasGhost
            ? [{ label: text.weekAgo, color: "var(--muted)", dash: GHOST_DASH, opacity: 0.75 }]
            : []),
        ]}
      />
      <StorageTank slope={data.spread / data.m1} label={byShape.tank} />
    </div>
  );

  const chart = (
    <ChartFrame
      title={fill(byShape.title, values)}
      footnote={fill(text.footnote, values)}
      height="h-64 sm:h-80"
      legend={legend}
    >
      <CurveChart
        points={data.points}
        mode={mode}
        labels={{ price: text.priceLabel, weekAgo: text.weekAgoLabel }}
      />
    </ChartFrame>
  );

  const controls =
    mode === "desk" ? (
      <StatList
        stats={[
          { label: copy.curve.desk_stats.spread, value: values.spread },
          { label: copy.curve.desk_stats.rollYield, value: values.rollYield },
          { label: copy.curve.desk_stats.strip, value: values.strip },
        ]}
      />
    ) : undefined;

  return (
    <Chapter
      id="curve"
      kicker={text.kicker}
      title={text.title}
      chart={chart}
      controls={controls}
      body={text.body.map((paragraph) =>
        fill(fill(paragraph, { shapeSentence: byShape.sentence }), values),
      )}
      aha={text.aha}
    />
  );
}
