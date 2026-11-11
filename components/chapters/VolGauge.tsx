"use client";
// Chapter 8. Compares the vol the market expects (OVX) with the vol oil has
// actually had: a Cheap / Fair / Rich dial in Plain mode, and the spread, its
// percentile and a three-year chart of both series in Desk mode.

import { useMemo } from "react";
import { copy, fill } from "@/lib/copy";
import { longDate, ordinal, pct } from "@/lib/format";
import type { VolData } from "@/lib/market";
import Chapter from "../Chapter";
import ChartFrame from "../charts/ChartFrame";
import { LegendRow } from "../charts/parts";
import VolDial from "../charts/VolDial";
import VolSpreadChart, { type VolRow } from "../charts/VolSpreadChart";
import { useMode } from "../ModeToggle";
import Readout from "../Readout";
import StatList from "../StatList";

/** Bottom third of the ranking is cheap (0), middle fair (1), top rich (2). */
function zoneOf(percentile: number): 0 | 1 | 2 {
  if (percentile < 100 / 3) return 0;
  if (percentile < 200 / 3) return 1;
  return 2;
}

/** A vol spread with its sign: +1.6 or −4.2. */
const signedPoints = (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(1)}`;

export default function VolGauge({ data }: { data: VolData }) {
  const mode = useMode();
  const plain = copy.volGauge.plain;
  const desk = copy.volGauge.desk;
  const stats = copy.volGauge.desk_stats;
  const text = mode === "desk" ? desk : plain;
  const zone = zoneOf(data.percentile);

  const values: Record<string, string> = {
    date: longDate(data.asOf),
    from: longDate(data.windowFrom),
    days: data.days.toLocaleString("en-US"),
    spread: mode === "desk" ? signedPoints(data.spread) : data.spread.toFixed(1),
    percentile: ordinal(Math.round(data.percentile)),
    zone: [text.zoneCheap, text.zoneFair, text.zoneRich][zone],
  };

  const rows: VolRow[] = useMemo(
    () =>
      data.rows.map(([d, iv, rv]) => ({
        t: Date.parse(d),
        d,
        iv,
        rv,
        band: [Math.min(iv, rv), Math.max(iv, rv)],
      })),
    [data.rows],
  );

  const chart =
    mode === "desk" ? (
      <ChartFrame
        title={fill(desk.chartTitle, values)}
        footnote={fill(desk.footnote, values)}
        height="h-72 sm:h-96"
        legend={
          <LegendRow
            items={[
              { label: desk.ivSeries, color: "var(--crude)", width: 2 },
              { label: desk.rvSeries, color: "var(--hedge)", dash: "5 3", width: 2 },
            ]}
          />
        }
      >
        <VolSpreadChart
          rows={rows}
          labels={{ iv: desk.ivSeries, rv: desk.rvSeries, gap: desk.gapSeries, y: desk.yLabel }}
        />
      </ChartFrame>
    ) : (
      <ChartFrame
        // The auto-written sentence: which one depends on where the needle is.
        title={[plain.sentenceCheap, plain.sentenceFair, plain.sentenceRich][zone]}
        footnote={fill(plain.footnote, values)}
        height="h-56 sm:h-72"
      >
        <VolDial
          percentile={data.percentile}
          zones={[plain.zoneCheap, plain.zoneFair, plain.zoneRich]}
          active={zone}
          label={fill(plain.dialLabel, values)}
        />
      </ChartFrame>
    );

  const controls =
    mode === "desk" ? (
      <StatList
        stats={[
          { label: stats.iv, value: data.iv.toFixed(1) },
          { label: stats.rv, value: data.rv.toFixed(1) },
          { label: stats.spread, value: fill(stats.spreadValue, values) },
          { label: stats.percentile, value: fill(stats.percentileValue, values) },
          { label: stats.sample, value: fill(stats.sampleValue, values) },
        ]}
      />
    ) : (
      <div className="space-y-2 border-y border-rule py-4">
        <Readout label={plain.expected} value={pct(data.iv / 100)} />
        <Readout label={plain.actual} value={pct(data.rv / 100)} />
        <Readout label={plain.gap} value={fill(plain.gapValue, values)} />
        <Readout label={plain.rank} value={pct(data.percentile / 100, 0)} />
      </div>
    );

  return (
    <Chapter
      id="vol-gauge"
      kicker={text.kicker}
      title={fill(text.title, values)}
      chart={chart}
      controls={controls}
      body={text.body.map((paragraph) => fill(paragraph, values))}
      aha={text.aha}
    />
  );
}
