"use client";
// Chapter 6. Keeps the put from chapter 5 and adds a call Dana sells; "Make
// it free" solves for the call strike that pays for the put and slides it in.

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { copy, fill } from "@/lib/copy";
import { DANA } from "@/lib/dana";
import { price, priceShort } from "@/lib/format";
import { black76Call, black76Greeks, collarRevenue, zeroCostCallStrike } from "@/lib/pricing";
import Chapter from "../Chapter";
import ChartFrame from "../charts/ChartFrame";
import { LegendRow } from "../charts/parts";
import PayoffChart, { payoffGrid, type PayoffLine } from "../charts/PayoffChart";
import { useHedge } from "../HedgeState";
import { useMode } from "../ModeToggle";
import Readout from "../Readout";
import Slider from "../Slider";
import StatList from "../StatList";
import { chartMax, optionValues } from "./optionText";

type NoSolution = "tooExpensive" | "tooCheap" | null;

export default function Collar() {
  const mode = useMode();
  const hedge = useHedge();
  const reduceMotion = useReducedMotion();
  const text = copy.collar[mode];
  const shared = copy.options[mode];
  const stats = copy.collar.desk_stats;
  const { F, T, r, sigma, putStrike, callStrike, setCallStrike } = hedge;

  const net = hedge.collarNet;
  const isFree = net === 0;

  const [noSolution, setNoSolution] = useState<NoSolution>(null);
  const slide = useRef<{ stop: () => void } | null>(null);
  useEffect(() => () => slide.current?.stop(), []);

  function makeItFree() {
    slide.current?.stop();
    const target = zeroCostCallStrike(F, putStrike, sigma, T, r);
    if (target === null) {
      // Work out which end of the F-to-3F range the solver fell off.
      const callAtF = black76Call(F, F, sigma, T, r);
      setNoSolution(hedge.putPremium > callAtF ? "tooExpensive" : "tooCheap");
      return;
    }
    setNoSolution(null);
    if (reduceMotion) {
      setCallStrike(target);
      return;
    }
    // Slide the ceiling from where it is to the solved strike over 600ms.
    slide.current = animate(callStrike, target, {
      duration: 0.6,
      ease: "easeInOut",
      onUpdate: setCallStrike,
      onComplete: () => setCallStrike(target),
    });
  }

  const values: Record<string, string> = {
    ...optionValues(hedge, mode),
    net: price(Math.abs(net)),
    floor: price(putStrike - net),
    cap: price(callStrike - net),
    name: isFree ? stats.costless : stats.notCostless,
  };

  const xMax = chartMax(callStrike);
  // Rebuilt on every draw: about 30 rows of arithmetic, far cheaper than a frame.
  const rows = payoffGrid(DANA.priceMin, xMax, [putStrike, callStrike]).map((s) => ({
    s,
    unhedged: s,
    collar: collarRevenue(s, putStrike, callStrike, net),
  }));

  const lines: PayoffLine[] = [
    { key: "unhedged", label: shared.unhedged, color: "var(--crude)", dash: "7 5", width: 2 },
    { key: "collar", label: fill(text.withCollar, values), color: "var(--hedge)", width: 3.5 },
  ];

  const title = fill(isFree ? text.chartFree : net > 0 ? text.chartCost : text.chartCredit, values);

  const chart = (
    <ChartFrame
      title={title}
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
          { x: putStrike, label: fill(text.floorMark, values) },
          { x: callStrike, label: fill(text.capMark, values) },
        ]}
      />
    </ChartFrame>
  );

  const netDelta =
    black76Greeks("put", F, putStrike, sigma, T, r).delta -
    black76Greeks("call", F, callStrike, sigma, T, r).delta;

  const controls = (
    <div className="space-y-5">
      <p className="text-sm text-muted">{fill(text.keptPut, values)}</p>
      <Slider
        label={text.callLabel}
        display={priceShort(callStrike)}
        value={callStrike}
        min={hedge.callMin}
        max={hedge.callMax}
        onChange={(strike) => {
          slide.current?.stop();
          setNoSolution(null);
          setCallStrike(strike);
        }}
        minLabel={`$${hedge.callMin}`}
        maxLabel={`$${hedge.callMax}`}
      />
      <div className="space-y-2 border-t border-rule pt-4">
        <Readout label={text.callIncome} value={price(hedge.callPremium)} unit={copy.common.perBarrel} />
        <Readout
          label={net < 0 ? text.netCredit : text.netCost}
          value={price(Math.abs(net))}
        />
      </div>
      <button
        type="button"
        onClick={makeItFree}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-base font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crude sm:w-auto"
      >
        {text.button}
      </button>
      {noSolution && (
        <p role="status" className="border-l-2 border-loss pl-3 text-sm text-ink">
          {fill(noSolution === "tooExpensive" ? text.noneTooExpensive : text.noneTooCheap, values)}
        </p>
      )}
      {mode === "desk" && (
        <StatList
          stats={[
            {
              label: stats.structure,
              value: `${values.name} ${values.strike}/${values.call}`,
            },
            {
              label: stats.net,
              value: isFree
                ? price(0)
                : fill(net > 0 ? stats.debit : stats.credit, { net: values.net }),
            },
            { label: stats.netDelta, value: netDelta.toFixed(4) },
          ]}
        />
      )}
    </div>
  );

  return (
    <Chapter
      id="collar"
      kicker={text.kicker}
      title={fill(text.title, values)}
      chart={chart}
      controls={controls}
      body={text.body.map((paragraph) => fill(paragraph, values))}
      aha={text.aha}
    />
  );
}
