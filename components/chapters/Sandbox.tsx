"use client";
// Chapter 9. The hedge desk: stack up to six legs, see the combined payoff
// and net premium, stress the hedge on four real oil years, and share it as
// a link that reopens the exact same hedge.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { copy, fill } from "@/lib/copy";
import { DANA } from "@/lib/dana";
import {
  compactVolume,
  dollars,
  longDate,
  monthShort,
  price,
  priceShort,
  strikeText,
} from "@/lib/format";
import type { SandboxData } from "@/lib/market";
import {
  legStripPremium,
  structureGreeks,
  structurePayoff,
  structurePremium,
  zeroCostStripCallStrike,
  type Leg,
  type LegType,
  type StripInputs,
} from "@/lib/pricing";
import { stressTest, type ScenarioKey } from "@/lib/scenarios";
import { decodeLegs, encodeLegs, LEGS_PARAM, MAX_LEGS, roundStrike } from "@/lib/share";
import Chapter from "../Chapter";
import ChartFrame from "../charts/ChartFrame";
import { LegendRow } from "../charts/parts";
import PayoffChart, { payoffGrid, type PayoffLine } from "../charts/PayoffChart";
import ScenarioBars, { BarLegend, type ScenarioBar } from "../charts/ScenarioBars";
import LegEditor from "../LegEditor";
import { useMode } from "../ModeToggle";
import Readout from "../Readout";
import StatList from "../StatList";

/** The oil price the chart's title sentence uses as its "bad month" example. */
const EXAMPLE_LOW = 40;
/** Amounts under 50 cents show as $0, so treat them as nothing. */
const NOTHING = 0.5;

// Reads the "?legs=…" part of the page address. Written this way (instead of
// reading it once when the page loads) so the first paint matches what the
// server sent, and a shared link is applied right after.
const subscribeToAddress = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};
const readAddress = () => window.location.search;
const noAddress = () => "";

/** A whole number with its sign: +12,345 or −12,345. */
const signedCount = (n: number) =>
  `${n < 0 ? "−" : "+"}${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

const PILL =
  "flex min-h-11 items-center rounded-full border border-rule px-4 text-sm font-medium text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crude disabled:opacity-50";

export default function Sandbox({ data }: { data: SandboxData }) {
  const mode = useMode();
  const text = copy.sandbox[mode];
  const stats = copy.sandbox.desk_stats;

  // Pricing inputs: one futures price per month, OVX as vol, T-bill as the rate.
  const strip: StripInputs = {
    forwards: data.months.map((m) => m.price),
    sigma: data.ovx.value / 100,
    r: data.tbill.value / 100,
  };
  // Starting strikes, set off the 12-month strip the same way chapter 7 does.
  const F = data.strip;
  const start = {
    floor: Math.round(F * 0.9),
    ceiling: Math.round(F * 1.15),
    trapdoor: Math.round(F * 0.75),
  };

  const swapHalf = (): Leg[] => [{ type: "swap", strike: F, volume: DANA.volume / 2 }];
  const costlessCollar = (): Leg[] | null => {
    const call = zeroCostStripCallStrike(strip, start.floor);
    if (call === null) return null;
    return [
      { type: "longPut", strike: start.floor, volume: DANA.volume },
      { type: "shortCall", strike: roundStrike(call), volume: DANA.volume },
    ];
  };
  const threeWay = (): Leg[] => [
    { type: "longPut", strike: start.floor, volume: DANA.volume },
    { type: "shortPut", strike: start.trapdoor, volume: DANA.volume },
    { type: "shortCall", strike: start.ceiling, volume: DANA.volume },
  ];

  // The hedge on screen is, in order: what the reader has built, else the
  // hedge in the page address (a shared link), else the costless collar.
  const address = useSyncExternalStore(subscribeToAddress, readAddress, noAddress);
  const shared = decodeLegs(new URLSearchParams(address).get(LEGS_PARAM));
  const [built, setBuilt] = useState<Leg[] | null>(null);
  const legs = built ?? shared ?? costlessCollar() ?? swapHalf();
  const [notice, setNotice] = useState<string | null>(null);

  /** Shows a new hedge and writes it into the page address. */
  function show(next: Leg[]) {
    setBuilt(next);
    setNotice(null);
    setCopied(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(LEGS_PARAM, encodeLegs(next));
      window.history.replaceState(null, "", url);
    } catch {
      // Some browsers limit how often the address can change. The hedge
      // still updates on screen, and Copy link always builds a fresh link.
    }
  }

  // Copy link ---------------------------------------------------------------
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  async function copyLink() {
    const { origin, pathname } = window.location;
    const link = `${origin}${pathname}?${LEGS_PARAM}=${encodeLegs(legs)}#sandbox`;
    try {
      await navigator.clipboard.writeText(link);
      setManualLink(null);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard access: show the link so it can be copied by hand.
      setManualLink(link);
    }
  }

  // The numbers ---------------------------------------------------------------
  const netPremium = structurePremium(legs, strip);
  const premiumPerMonth = netPremium / strip.forwards.length;
  /** Dana's revenue in $ for one month that settles at S, with and without the hedge. */
  const unhedgedAt = (S: number) => S * DANA.volume;
  const hedgedAt = (S: number) => unhedgedAt(S) + structurePayoff(legs, S) - premiumPerMonth;

  const values: Record<string, string> = {
    date: longDate(data.asOf),
    volume: DANA.volume.toLocaleString("en-US"),
    today: price(data.front),
    ovx: data.ovx.value.toFixed(1),
    ovxDate: longDate(data.ovx.date),
    rate: `${data.tbill.value.toFixed(2)}%`,
    rateDate: longDate(data.tbill.date),
    spotDate: longDate(data.spotAsOf),
    low: priceShort(EXAMPLE_LOW),
    hedged: dollars(hedgedAt(EXAMPLE_LOW)),
    unhedged: dollars(unhedgedAt(EXAMPLE_LOW)),
    max: String(MAX_LEGS),
  };

  // Payoff chart --------------------------------------------------------------
  const topStrike = Math.max(0, ...legs.map((leg) => leg.strike));
  const xMax = Math.max(DANA.priceMax, Math.ceil((topStrike + 10) / 10) * 10);
  const rows = payoffGrid(
    DANA.priceMin,
    xMax,
    legs.map((leg) => leg.strike),
  ).map((s) => ({ s, unhedged: unhedgedAt(s), hedged: hedgedAt(s) }));

  const lines: PayoffLine[] = [
    { key: "unhedged", label: text.unhedged, color: "var(--crude)", dash: "7 5", width: 2 },
    { key: "hedged", label: text.hedged, color: "var(--hedge)", width: 3.5 },
  ];

  const payoffChart = (
    <ChartFrame
      title={fill(legs.length === 0 ? text.chartEmpty : text.chartTitle, values)}
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
        markers={[{ x: data.front, label: fill(text.todayMark, values) }]}
        money
      />
    </ChartFrame>
  );

  // Legs ----------------------------------------------------------------------
  const typeNames: Record<LegType, string> = {
    swap: text.typeSwap,
    longPut: text.typeLongPut,
    shortPut: text.typeShortPut,
    shortCall: text.typeShortCall,
  };
  const summaries: Record<LegType, string> = {
    swap: text.legSwap,
    longPut: text.legLongPut,
    shortPut: text.legShortPut,
    shortCall: text.legShortCall,
  };
  const describe = (leg: Leg) =>
    fill(summaries[leg.type], {
      strike: mode === "desk" ? strikeText(leg.strike) : priceShort(leg.strike),
      volume: mode === "desk" ? compactVolume(leg.volume) : leg.volume.toLocaleString("en-US"),
    });
  const premiumLine = (leg: Leg) => {
    const total = legStripPremium(leg, strip);
    if (Math.abs(total) < NOTHING) return text.legFree;
    const perBarrel = Math.abs(total) / (leg.volume * strip.forwards.length);
    return fill(total > 0 ? text.legCost : text.legIncome, {
      amount: dollars(Math.abs(total)),
      avg: price(perBarrel),
    });
  };

  function loadCollar() {
    const collar = costlessCollar();
    if (collar) return show(collar);
    setNotice(
      fill(text.collarUnavailable, {
        F: price(F),
        callMax: price(3 * F),
        strike: priceShort(start.floor),
      }),
    );
  }

  const greeks = structureGreeks(legs, strip);

  const builder = (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted">{text.presetsLabel}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={PILL} onClick={() => show(swapHalf())}>
            {text.presetSwap}
          </button>
          <button type="button" className={PILL} onClick={loadCollar}>
            {text.presetCollar}
          </button>
          <button type="button" className={PILL} onClick={() => show(threeWay())}>
            {text.presetThreeWay}
          </button>
        </div>
        {notice && (
          <p role="status" className="mt-3 border-l-2 border-loss pl-3 text-sm text-ink">
            {notice}
          </p>
        )}
      </div>

      {legs.length === 0 ? (
        <p className="text-sm text-muted">{text.noLegs}</p>
      ) : (
        <ol className="space-y-3">
          {legs.map((leg, i) => (
            <LegEditor
              key={i}
              leg={leg}
              summary={describe(leg)}
              premiumLine={premiumLine(leg)}
              labels={{
                type: text.typeLabel,
                strike: text.strikeLabel,
                volume: text.volumeLabel,
                remove: fill(text.removeLeg, { n: String(i + 1) }),
                types: typeNames,
              }}
              onChange={(changed) => show(legs.map((old, j) => (j === i ? changed : old)))}
              onRemove={() => show(legs.filter((_, j) => j !== i))}
            />
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={PILL}
          disabled={legs.length >= MAX_LEGS}
          onClick={() =>
            show([...legs, { type: "longPut", strike: start.floor, volume: DANA.volume }])
          }
        >
          <span aria-hidden className="mr-1.5">
            +
          </span>
          {text.addLeg}
        </button>
        {legs.length >= MAX_LEGS && (
          <p className="text-sm text-muted">{fill(text.legLimit, values)}</p>
        )}
      </div>

      <div className="border-t border-rule pt-4">
        <Readout
          label={netPremium < -NOTHING ? text.netCredit : text.netCost}
          value={dollars(Math.abs(netPremium))}
        />
      </div>

      {mode === "desk" && (
        <>
          <StatList
            stats={[
              { label: stats.delta, value: signedCount(greeks.delta) },
              { label: stats.gamma, value: signedCount(greeks.gamma) },
              { label: stats.vega, value: dollars(greeks.vega) },
              { label: stats.theta, value: dollars(greeks.theta) },
            ]}
          />
          <p className="text-sm text-muted">
            {fill(stats.greeksNote, {
              physical: (DANA.volume * strip.forwards.length).toLocaleString("en-US"),
            })}
          </p>
        </>
      )}
    </div>
  );

  // Stress test ---------------------------------------------------------------
  const scenarioNames: Record<ScenarioKey, string> = {
    crash2008: text.scenarioCrash2008,
    priceWar2014: text.scenarioPriceWar2014,
    covid2020: text.scenarioCovid2020,
    spike2022: text.scenarioSpike2022,
  };
  const monthLabel = (month: string) => `${monthShort(month)} ${month.slice(0, 4)}`;
  const results = data.scenarios.map((scenario) => {
    const { unhedged, hedged } = stressTest(scenario.scaled, legs, DANA.volume, netPremium);
    return {
      key: scenario.key,
      name: scenarioNames[scenario.key],
      range: fill(text.scenarioRange, {
        from: monthLabel(scenario.months[0]),
        to: monthLabel(scenario.months[scenario.months.length - 1]),
      }),
      low: Math.min(...scenario.scaled),
      high: Math.max(...scenario.scaled),
      year: scenario.months[0].slice(0, 4),
      unhedged,
      hedged,
      diff: hedged - unhedged,
    };
  });

  const bars: ScenarioBar[] = results.map((result) => ({
    tick: result.year,
    name: result.name,
    detail: fill(text.pathRange, { low: price(result.low), high: price(result.high) }),
    unhedged: result.unhedged,
    hedged: result.hedged,
  }));

  // The auto-written sentence under the bars.
  const best = results.reduce((a, b) => (b.diff > a.diff ? b : a));
  const worst = results.reduce((a, b) => (b.diff < a.diff ? b : a));
  const resultValues = {
    best: best.name,
    worst: worst.name,
    bestAmount: dollars(Math.abs(best.diff)),
    worstAmount: dollars(Math.abs(worst.diff)),
  };
  const resultSentence =
    legs.length === 0
      ? text.resultNone
      : results.every((result) => Math.abs(result.diff) < NOTHING)
        ? text.resultFlat
        : worst.diff >= 0
          ? fill(text.resultAllHelp, resultValues)
          : best.diff <= 0
            ? fill(text.resultAllHurt, resultValues)
            : fill(text.resultBoth, resultValues);

  const stressChart = (
    <ChartFrame
      title={text.stressChartTitle}
      footnote={fill(text.stressFootnote, values)}
      height="h-64 sm:h-80"
      legend={<BarLegend unhedged={text.unhedged} hedged={text.hedged} />}
    >
      <ScenarioBars
        bars={bars}
        mode={mode}
        labels={{
          unhedged: text.unhedged,
          hedged: text.hedged,
          diff: text.tableDiff,
          y: text.stressYLabel,
        }}
      />
    </ChartFrame>
  );

  const stressControls = (
    <div className="space-y-5">
      <p role="status" className="text-lg leading-relaxed font-medium text-ink">
        {resultSentence}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="pb-1 text-left text-sm font-medium text-muted">
            {text.tableTitle}
          </caption>
          <thead>
            <tr className="border-b border-rule text-muted">
              <th className="hidden py-1.5 pr-2 text-left font-normal sm:table-cell">
                {text.tableScenario}
              </th>
              <th className="py-1.5 text-right font-normal sm:pl-2">{text.tableUnhedged}</th>
              <th className="py-1.5 pl-2 text-right font-normal">{text.tableHedged}</th>
              <th className="py-1.5 pl-2 text-right font-normal">{text.tableDiff}</th>
            </tr>
          </thead>
          {results.map((result) => (
            <tbody key={result.key}>
              {/* On a phone the replay's name gets its own line above its numbers. */}
              <tr className="sm:hidden">
                <th colSpan={3} scope="rowgroup" className="pt-2 text-left font-normal">
                  {result.name}
                  <span className="ml-2 text-xs text-muted">{result.range}</span>
                </th>
              </tr>
              <tr className="border-b border-rule align-top">
                <th className="hidden py-1.5 pr-2 text-left font-normal sm:table-cell">
                  {result.name}
                  <span className="block text-xs text-muted">{result.range}</span>
                </th>
                <td className="num py-1.5 text-right sm:pl-2">{dollars(result.unhedged)}</td>
                <td className="num py-1.5 pl-2 text-right font-semibold">
                  {dollars(result.hedged)}
                </td>
                <td
                  className={`num py-1.5 pl-2 text-right ${
                    result.diff >= NOTHING
                      ? "text-gain"
                      : result.diff <= -NOTHING
                        ? "text-loss"
                        : "text-ink"
                  }`}
                >
                  {dollars(result.diff)}
                </td>
              </tr>
            </tbody>
          ))}
        </table>
      </div>
      {mode === "desk" && (
        <p className="border-l-2 border-crude pl-3 text-sm text-muted">{stats.asianNote}</p>
      )}
      <div className="border-t border-rule pt-4">
        <p className="text-sm text-muted">{text.shareIntro}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copyLink}
            className="flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-base font-medium text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crude"
          >
            {text.copyLink}
          </button>
          <span role="status" className="text-sm font-medium text-gain">
            {copied ? text.copied : ""}
          </span>
        </div>
        {manualLink && (
          <label className="mt-3 block text-sm text-muted">
            {text.copyFailed}
            <input
              readOnly
              value={manualLink}
              onFocus={(event) => event.target.select()}
              className="num mt-1 h-11 w-full rounded border border-rule bg-paper px-3 text-sm text-ink"
            />
          </label>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Chapter
        id="sandbox"
        kicker={text.kicker}
        title={fill(text.title, values)}
        chart={payoffChart}
        controls={builder}
        body={text.body.map((paragraph) => fill(paragraph, values))}
      />
      <Chapter
        id="stress"
        kicker={text.stressKicker}
        title={text.stressTitle}
        chart={stressChart}
        controls={stressControls}
        body={text.stressBody.map((paragraph) => fill(paragraph, values))}
        aha={text.aha}
      />
    </>
  );
}
