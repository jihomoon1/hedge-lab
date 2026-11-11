// The four real 12-month WTI price paths the hedge desk's stress test uses,
// built from FRED's daily spot series (DCOILWTICO), plus the math that runs
// a hedge through one of them.

import type { Observation } from "./market";
import { structurePayoff, type Leg } from "./pricing";

export type ScenarioKey = "crash2008" | "priceWar2014" | "covid2020" | "spike2022";

/** Each scenario's first and last month, "YYYY-MM". */
export const SCENARIOS: { key: ScenarioKey; from: string; to: string }[] = [
  { key: "crash2008", from: "2008-07", to: "2009-06" },
  { key: "priceWar2014", from: "2014-07", to: "2015-06" },
  { key: "covid2020", from: "2020-01", to: "2020-12" },
  { key: "spike2022", from: "2022-01", to: "2022-12" },
];

export type MonthAverage = { month: string; average: number };

/**
 * The average daily price in each calendar month from `from` to `to`
 * ("YYYY-MM", both included). Crude swaps settle against this monthly
 * average, not against one day's price.
 */
export function monthlyAverages(prices: Observation[], from: string, to: string): MonthAverage[] {
  const byMonth = new Map<string, { sum: number; count: number }>();
  for (const { date, value } of prices) {
    const month = date.slice(0, 7);
    if (month < from || month > to) continue;
    const entry = byMonth.get(month) ?? { sum: 0, count: 0 };
    entry.sum += value;
    entry.count += 1;
    byMonth.set(month, entry);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, count }]) => ({ month, average: sum / count }));
}

/**
 * Rescales a price path by percent change so its first price equals
 * `startPrice`: every price is multiplied by startPrice ÷ path[0]. A path
 * that fell 50% still falls 50%. A price at or below zero stays at or below
 * zero; it is not clipped. Returns null if the path cannot be rescaled
 * (empty, or a first price at or below zero).
 */
export function rescalePath(path: number[], startPrice: number): number[] | null {
  if (path.length === 0 || !(path[0] > 0)) return null;
  const factor = startPrice / path[0];
  return path.map((p) => p * factor);
}

export type ScenarioPath = {
  key: ScenarioKey;
  /** The 12 calendar months, "YYYY-MM" */
  months: string[];
  /** What oil actually averaged each month, $/bbl */
  actual: number[];
  /** The same path rescaled so the first month equals today's front-month price */
  scaled: number[];
};

/**
 * Builds all four scenarios from the daily spot history. Averaging each
 * month and then rescaling gives the same numbers as rescaling every day and
 * then averaging, because rescaling is one multiplication. A scenario is
 * left out if its 12 months are not all in the data.
 */
export function scenarioPaths(spot: Observation[], startPrice: number): ScenarioPath[] {
  const paths: ScenarioPath[] = [];
  for (const { key, from, to } of SCENARIOS) {
    const months = monthlyAverages(spot, from, to);
    if (months.length !== 12) continue;
    const actual = months.map((m) => m.average);
    const scaled = rescalePath(actual, startPrice);
    if (!scaled) continue;
    paths.push({ key, months: months.map((m) => m.month), actual, scaled });
  }
  return paths;
}

export type StressResult = {
  /** Total revenue in $ over the path with no hedge = Σ price × barrels */
  unhedged: number;
  /** The same, plus what the legs pay each month, minus the net premium */
  hedged: number;
};

/**
 * Runs a hedge through a path of monthly average prices. Each month settles
 * against that month's average:
 *   hedged = Σ over months [ price × barrels + what the legs pay ] − net premium
 * `netPremium` is the $ total for the whole structure (positive = Dana paid).
 */
export function stressTest(
  monthlyPrices: number[],
  legs: Leg[],
  barrelsPerMonth: number,
  netPremium: number,
): StressResult {
  let unhedged = 0;
  let payoffs = 0;
  for (const S of monthlyPrices) {
    unhedged += S * barrelsPerMonth;
    payoffs += structurePayoff(legs, S);
  }
  return { unhedged, hedged: unhedged + payoffs - netPremium };
}

/**
 * The totals as the site shows them: each rounded to whole dollars first,
 * and the difference taken from those rounded totals. That way the three
 * numbers in a row always add up by hand (hedged − unhedged = difference),
 * which rounding the raw difference on its own cannot guarantee.
 */
export function wholeDollars(result: StressResult): StressResult & { diff: number } {
  const unhedged = Math.round(result.unhedged);
  const hedged = Math.round(result.hedged);
  return { unhedged, hedged, diff: hedged - unhedged };
}
