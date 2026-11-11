"use client";
// Chapter 2. WTI's daily price since 2007 with a Play button and five pinned
// events; Desk mode adds a realized-vol panel under the price.

import { useCallback, useMemo, useState } from "react";
import { copy, fill } from "@/lib/copy";
import { longDate, monthYear, pct, price } from "@/lib/format";
import type { HistoryData } from "@/lib/market";
import Chapter from "../Chapter";
import ChartFrame from "../charts/ChartFrame";
import PriceHistory, { type HistoryRow } from "../charts/PriceHistory";
import { useMode } from "../ModeToggle";
import RichText from "../RichText";

export default function History({ data }: { data: HistoryData }) {
  const mode = useMode();
  const text = copy.history[mode];
  const [playToken, setPlayToken] = useState(0);
  const [playing, setPlaying] = useState(false);
  const onPlayEnd = useCallback(() => setPlaying(false), []);

  const rows: HistoryRow[] = useMemo(
    () => data.rows.map(([d, p, rv]) => ({ t: Date.parse(d), d, p, rv })),
    [data.rows],
  );
  const pins = data.callouts.map((callout, i) => ({
    n: i + 1,
    t: Date.parse(callout.date),
    p: callout.price,
  }));

  const values = {
    high: price(data.high.value),
    low: price(data.low.value),
    rvMax: pct(data.rvMax.value, 0),
    rvMaxDate: longDate(data.rvMax.date),
    date: longDate(data.asOf),
  };

  const chart = (
    <ChartFrame
      title={fill(text.chartTitle, values)}
      footnote={fill(text.footnote, values)}
      height={mode === "desk" ? "h-[26rem] sm:h-[30rem]" : "h-72 sm:h-96"}
    >
      <PriceHistory
        rows={rows}
        pins={pins}
        mode={mode}
        playToken={playToken}
        playing={playing}
        onPlayEnd={onPlayEnd}
        labels={{
          price: text.priceSeries,
          vol: text.volSeries,
          through: text.through,
          volGapNote: text.volGapNote,
        }}
        rvGaps={data.rvGaps.map((gap) => ({ from: Date.parse(gap.from), to: Date.parse(gap.to) }))}
      />
    </ChartFrame>
  );

  const controls = (
    <button
      type="button"
      disabled={playing}
      onClick={() => {
        setPlaying(true);
        setPlayToken((token) => token + 1);
      }}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crude disabled:opacity-60 sm:w-auto"
    >
      <span aria-hidden>▶</span>
      {playing ? text.playing : playToken > 0 ? text.replay : text.play}
    </button>
  );

  // The numbered list that matches the pins on the chart.
  const calloutList = (
    <ol className="space-y-3 text-base">
      {data.callouts.map((callout, i) => {
        const words = copy.history.callouts[callout.key][mode];
        const filled: Record<string, string> = {};
        for (const [key, value] of Object.entries(callout.values)) {
          // OVX is an index level, not a dollar price.
          filled[key] = key === "ovx" ? value.toFixed(2) : price(value);
        }
        for (const [key, value] of Object.entries(callout.dates)) {
          filled[key] = longDate(value);
          filled[`${key}Month`] = monthYear(value);
        }
        return (
          <li key={callout.key} className="flex gap-3">
            <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink text-xs font-semibold">
              {i + 1}
            </span>
            <span>
              <strong>{words.title}.</strong> <RichText text={fill(words.text, filled)} />
            </span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <Chapter
      id="history"
      kicker={text.kicker}
      title={text.title}
      chart={chart}
      controls={controls}
      body={text.body.map((paragraph) => fill(paragraph, values))}
      extra={calloutList}
      aha={text.aha}
    />
  );
}
