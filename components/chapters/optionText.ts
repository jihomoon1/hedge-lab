// Builds the {placeholder} values the three option chapters share, so their
// copy can mention the same strikes, premiums and pricing inputs.

import { copy, fill, type Mode } from "@/lib/copy";
import { DANA } from "@/lib/dana";
import { longDate, monthYear, price, priceShort, strikeText } from "@/lib/format";
import type { Hedge } from "../HedgeState";

export function optionValues(hedge: Hedge, mode: Mode): Record<string, string> {
  const shared = copy.options[mode];
  // Plain mode writes strikes as prices ($72); Desk mode as bare numbers (72).
  const strike = mode === "desk" ? strikeText : priceShort;
  return {
    date: longDate(hedge.data.asOf),
    contract: monthYear(hedge.contractMonth),
    F: price(hedge.F),
    ovx: hedge.data.ovx.value.toFixed(1),
    ovxDate: longDate(hedge.data.ovx.date),
    rate: `${hedge.data.tbill.value.toFixed(2)}%`,
    rateDate: longDate(hedge.data.tbill.date),
    T: hedge.T.toFixed(2),
    months: String(hedge.months),
    monthsText:
      hedge.months === 1
        ? shared.monthsOne
        : fill(shared.monthsMany, { months: String(hedge.months) }),
    volume: DANA.volume.toLocaleString("en-US"),
    strike: strike(hedge.putStrike),
    call: strike(hedge.callStrike),
    low: strike(hedge.lowStrike),
    putPremium: price(hedge.putPremium),
    callPremium: price(hedge.callPremium),
    callMax: strike(hedge.callMax),
  };
}

/** The right edge of a payoff chart: $130, or further if the ceiling is beyond it. */
export function chartMax(callStrike: number): number {
  return Math.max(DANA.priceMax, Math.ceil((callStrike + 10) / 10) * 10);
}
