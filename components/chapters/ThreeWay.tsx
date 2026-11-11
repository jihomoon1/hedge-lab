"use client";
// Chapter 7. Adds a lower put Dana sells to the collar, shades the "trapdoor"
// zone where protection stops, and replays a 2020-style crash to $20.

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { copy, fill } from "@/lib/copy";
import { DANA } from "@/lib/dana";
import { dollars, price, priceShort } from "@/lib/format";
import { collarRevenue, monthlyRevenue, threeWayRevenue } from "@/lib/pricing";
import Chapter from "../Chapter";
import ChartFrame from "../charts/ChartFrame";
import { LegendRow } from "../charts/parts";
import PayoffChart, {
  payoffGrid,
  type PayoffLine,
  type PayoffMarker,
} from "../charts/PayoffChart";
import { cents, useHedge } from "../HedgeState";
import { useMode } from "../ModeToggle";
import Readout from "../Readout";
import Slider from "../Slider";
import StatList from "../StatList";
import { chartMax, optionValues } from "./optionText";

export default function ThreeWay() {
  const mode = useMode();
  const hedge = useHedge();
  const reduceMotion = useReducedMotion();
  const text = copy.threeWay[mode];
  const shared = copy.options[mode];
  const stats = copy.threeWay.desk_stats;
  const { F, putStrike, callStrike, lowStrike } = hedge;

  const strikes = { low: lowStrike, mid: putStrike, high: callStrike };
  const collarNet = hedge.collarNet;
  // Selling the lower put brings in its premium on top of the collar's net.
  const net = cents(collarNet - hedge.lowPutPremium);
  const isFree = net === 0;
  const width = putStrike - lowStrike;

  // Replay 2020: the settlement price falls from today's futures price to $20.
  const [replayPrice, setReplayPrice] = useState<number | null>(null);
  const [replaying, setReplaying] = useState(false);
  const fall = useRef<{ stop: () => void } | null>(null);
  useEffect(() => () => fall.current?.stop(), []);

  function replay() {
    fall.current?.stop();
    if (reduceMotion) {
      setReplayPrice(DANA.priceMin);
      return;
    }
    setReplaying(true);
    fall.current = animate(F, DANA.priceMin, {
      duration: 2,
      ease: "easeIn",
      onUpdate: setReplayPrice,
      onComplete: () => {
        setReplayPrice(DANA.priceMin);
        setReplaying(false);
      },
    });
  }

  const values: Record<string, string> = {
    ...optionValues(hedge, mode),
    net: price(Math.abs(net)),
    width: price(width),
  };

  const xMax = chartMax(callStrike);
  // Rebuilt on every draw: about 30 rows of arithmetic, far cheaper than a frame.
  const rows = payoffGrid(DANA.priceMin, xMax, [lowStrike, putStrike, callStrike]).map((s) => ({
    s,
    unhedged: s,
    collar: collarRevenue(s, putStrike, callStrike, collarNet),
    threeWay: threeWayRevenue(s, strikes, net),
  }));

  const lines: PayoffLine[] = [
    { key: "unhedged", label: shared.unhedged, color: "var(--crude)", dash: "7 5", width: 2 },
    {
      key: "collar",
      label: fill(text.collarLine, values),
      color: "var(--hedge)",
      dash: "2 4",
      width: 2,
    },
    { key: "threeWay", label: fill(text.threeWayLine, values), color: "var(--hedge)", width: 3.5 },
  ];

  const markers: PayoffMarker[] = [
    { x: lowStrike, label: fill(text.lowMark, values) },
    { x: putStrike, label: fill(text.floorMark, values) },
    { x: callStrike, label: fill(text.capMark, values) },
  ];
  if (replayPrice !== null) {
    markers.push({
      x: replayPrice,
      label: fill(text.oilMark, { price: price(replayPrice) }),
      strong: true,
      row: 2,
    });
  }

  // The three live numbers: Dana's monthly revenue under each choice.
  const at = replayPrice ?? F;
  const outcomes = [
    { label: shared.unhedged, perBarrel: at },
    {
      label: fill(text.collarLine, values),
      perBarrel: collarRevenue(at, strikes.mid, strikes.high, collarNet),
    },
    { label: fill(text.threeWayLine, values), perBarrel: threeWayRevenue(at, strikes, net) },
  ];

  const chart = (
    <div>
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
          markers={markers}
          zone={{ from: DANA.priceMin, to: lowStrike, label: text.zoneLabel }}
        />
      </ChartFrame>

      <div className="mt-4 border-t border-rule pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted">
            {fill(text.replayAt, { price: price(at) })}
          </p>
          <button
            type="button"
            disabled={replaying}
            onClick={replay}
            className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crude disabled:opacity-60"
          >
            <span aria-hidden>▶</span>
            {replaying ? text.replaying : replayPrice !== null ? text.replayAgain : text.replay}
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          {outcomes.map((outcome) => (
            <div key={outcome.label}>
              <dt className="text-xs leading-tight text-muted">{outcome.label}</dt>
              <dd className="num mt-1 text-base font-semibold text-ink sm:text-xl">
                {dollars(monthlyRevenue(outcome.perBarrel, DANA.volume))}
              </dd>
              <dd className="num text-xs text-muted">
                {price(outcome.perBarrel)} {copy.common.perBarrelShort}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );

  const controls = (
    <div className="space-y-5">
      <p className="text-sm text-muted">{fill(text.keptCollar, values)}</p>
      <Slider
        label={text.lowLabel}
        display={priceShort(lowStrike)}
        value={lowStrike}
        min={hedge.lowMin}
        max={hedge.lowMax}
        onChange={hedge.setLowStrike}
        minLabel={`$${hedge.lowMin}`}
        maxLabel={`$${hedge.lowMax}`}
      />
      <div className="border-t border-rule pt-4">
        <Readout
          label={net < 0 ? text.netCredit : text.netCost}
          value={price(Math.abs(net))}
        />
      </div>
      {mode === "desk" && (
        <>
          <StatList
            stats={[
              {
                label: stats.net,
                value: isFree
                  ? price(0)
                  : fill(net > 0 ? stats.debit : stats.credit, { net: values.net }),
              },
              { label: stats.maxProtection, value: price(width) },
            ]}
          />
          <p className="border-l-2 border-crude pl-3 text-sm text-muted">{stats.skewNote}</p>
        </>
      )}
    </div>
  );

  return (
    <Chapter
      id="three-way"
      kicker={text.kicker}
      title={fill(text.title, values)}
      chart={chart}
      controls={controls}
      body={text.body.map((paragraph) => fill(paragraph, values))}
      aha={text.aha}
    />
  );
}
