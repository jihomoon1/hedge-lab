"use client";
// Chapter 5. Strike and expiry sliders price a put live with Black-76; the
// chart shows the floor it buys, and Desk mode adds Greeks and a vol bump.

import { useState } from "react";
import { copy, fill } from "@/lib/copy";
import { DANA } from "@/lib/dana";
import { dollars, price, priceShort, signedPct, signedPrice } from "@/lib/format";
import { black76Greeks, black76Put, putRevenue } from "@/lib/pricing";
import Chapter from "../Chapter";
import ChartFrame from "../charts/ChartFrame";
import { LegendRow } from "../charts/parts";
import PayoffChart, { payoffGrid, type PayoffLine } from "../charts/PayoffChart";
import { cents, useHedge } from "../HedgeState";
import { useMode } from "../ModeToggle";
import Readout from "../Readout";
import Slider from "../Slider";
import StatList from "../StatList";
import { optionValues } from "./optionText";

/** The "vol +5 pts" button adds this much to sigma. */
const VOL_BUMP = 0.05;

export default function Put() {
  const mode = useMode();
  const hedge = useHedge();
  const text = copy.put[mode];
  const shared = copy.options[mode];
  const stats = copy.put.desk_stats;
  const { F, T, r, sigma, putStrike, months } = hedge;

  // The vol bump is a Desk-mode "what if": it never changes chapters 6 and 7.
  const [bumpOn, setBumpOn] = useState(false);
  const bumped = mode === "desk" && bumpOn;
  const sigmaUsed = bumped ? sigma + VOL_BUMP : sigma;

  const basePremium = hedge.putPremium;
  const premium = bumped ? cents(black76Put(F, putStrike, sigmaUsed, T, r)) : basePremium;
  const greeks = black76Greeks("put", F, putStrike, sigmaUsed, T, r);
  const floor = putStrike - premium;
  const totalCost = premium * DANA.volume * months;

  const values: Record<string, string> = {
    ...optionValues(hedge, mode),
    premium: price(premium),
    // The premium before any vol bump, for text that quotes the base inputs.
    basePremium: price(basePremium),
    floor: price(floor),
    delta: greeks.delta.toFixed(2),
  };

  // Rebuilt on every draw: about 25 rows of arithmetic, far cheaper than a frame.
  const rows = payoffGrid(DANA.priceMin, DANA.priceMax, [putStrike]).map((s) => ({
    s,
    unhedged: s,
    put: putRevenue(s, putStrike, premium),
  }));

  const lines: PayoffLine[] = [
    { key: "unhedged", label: shared.unhedged, color: "var(--crude)", dash: "7 5", width: 2 },
    { key: "put", label: fill(text.withPut, values), color: "var(--hedge)", width: 3.5 },
  ];

  const chart = (
    <ChartFrame
      title={fill(text.chartTitle, values)}
      footnote={fill(shared.footnote, values)}
      height="h-80 sm:h-[26rem]"
      legend={<LegendRow items={lines} />}
    >
      <PayoffChart
        rows={rows}
        lines={lines}
        mode={mode}
        xLabel={shared.xLabel}
        yLabel={shared.yLabel}
        markers={[
          { x: putStrike, label: fill(text.strikeMark, values) },
          { x: F, label: fill(shared.futuresMark, values) },
        ]}
      />
    </ChartFrame>
  );

  const controls = (
    <div className="space-y-5">
      <Slider
        label={text.strikeLabel}
        display={priceShort(putStrike)}
        value={putStrike}
        min={DANA.priceMin}
        max={DANA.priceMax}
        onChange={hedge.setPutStrike}
        minLabel={`$${DANA.priceMin}`}
        maxLabel={`$${DANA.priceMax}`}
      />
      <Slider
        label={text.monthsLabel}
        display={values.monthsText}
        value={months}
        min={1}
        max={hedge.data.months.length}
        onChange={hedge.setMonths}
        minLabel="1"
        maxLabel={String(hedge.data.months.length)}
      />
      <div className="space-y-2 border-t border-rule pt-4">
        <Readout label={text.premiumLabel} value={price(premium)} unit={text.premiumUnit} />
        <Readout label={fill(text.totalLabel, values)} value={dollars(totalCost)} />
      </div>

      {mode === "desk" && (
        <>
          <StatList
            stats={[
              { label: stats.delta, value: greeks.delta.toFixed(4) },
              { label: stats.gamma, value: greeks.gamma.toFixed(4) },
              { label: stats.vega, value: price(greeks.vega) },
              { label: stats.theta, value: signedPrice(greeks.theta) },
            ]}
          />
          <div className="space-y-2">
            <button
              type="button"
              aria-pressed={bumpOn}
              onClick={() => setBumpOn((on) => !on)}
              className={`min-h-11 rounded-full border px-5 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crude ${
                bumpOn ? "border-crude bg-crude text-paper" : "border-rule text-ink"
              }`}
            >
              {stats.bumpButton}
            </button>
            {bumpOn && (
              <p className="font-mono text-sm text-ink" role="status">
                <span className="block text-muted">
                  {fill(stats.bumpTitle, {
                    ovx: values.ovx,
                    ovxBumped: (hedge.data.ovx.value + VOL_BUMP * 100).toFixed(1),
                  })}
                </span>
                {fill(stats.bumpResult, {
                  base: price(basePremium),
                  bumped: price(premium),
                  change: signedPrice(premium - basePremium),
                  changePct: basePremium > 0 ? signedPct(premium / basePremium - 1) : "n/a",
                })}
              </p>
            )}
          </div>
          <p className="border-l-2 border-crude pl-3 text-sm text-muted">{stats.proxyNote}</p>
        </>
      )}
    </div>
  );

  return (
    <Chapter
      id="put"
      kicker={text.kicker}
      title={fill(text.title, values)}
      chart={chart}
      controls={controls}
      body={text.body.map((paragraph) => fill(paragraph, values))}
      aha={text.aha}
    />
  );
}
