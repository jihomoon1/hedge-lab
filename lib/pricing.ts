// All the site's math lives here (SPEC "The math"). It runs in the browser.
//
// Notation, same as the spec:
//   F = futures price          K = strike
//   sigma = implied vol as a decimal (OVX 40 → 0.40)
//   T = years to expiry        r = T-bill rate as a decimal (4% → 0.04)

// ---------------------------------------------------------------------------
// Normal distribution
// ---------------------------------------------------------------------------

/** φ: the standard normal density (the bell curve's height at x). */
export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * N: the standard normal CDF (the chance a standard normal value is below x).
 * Uses Marsaglia's series, N(x) = 1/2 + φ(x)·(x + x³/3 + x⁵/(3·5) + ...),
 * which is accurate to about 15 digits. (A common shortcut formula is only
 * good to 7 digits, which is not enough to match the spec to 4 decimals.)
 */
export function normCdf(x: number): number {
  if (x < -8) return 0;
  if (x > 8) return 1;
  let term = x;
  let sum = x;
  for (let i = 3; Math.abs(term) > 1e-17 * Math.abs(sum) && i < 400; i += 2) {
    term *= (x * x) / i;
    sum += term;
  }
  return 0.5 + sum * normPdf(x);
}

// ---------------------------------------------------------------------------
// Black-76: options on futures
// ---------------------------------------------------------------------------

export type OptionType = "call" | "put";

/** True when there is no time or no vol left, so an option is worth only its payoff. */
const isExpired = (sigma: number, T: number) => !(sigma > 0) || !(T > 0);

function d1d2(F: number, K: number, sigma: number, T: number) {
  const volRootT = sigma * Math.sqrt(T);
  const d1 = (Math.log(F / K) + (sigma * sigma * T) / 2) / volRootT;
  return { d1, d2: d1 - volRootT };
}

/** Call = e^(−rT) · [F·N(d1) − K·N(d2)], in $/bbl. */
export function black76Call(F: number, K: number, sigma: number, T: number, r: number): number {
  const discount = Math.exp(-r * Math.max(T, 0));
  if (isExpired(sigma, T)) return discount * Math.max(F - K, 0);
  const { d1, d2 } = d1d2(F, K, sigma, T);
  return discount * (F * normCdf(d1) - K * normCdf(d2));
}

/** Put = e^(−rT) · [K·N(−d2) − F·N(−d1)], in $/bbl. */
export function black76Put(F: number, K: number, sigma: number, T: number, r: number): number {
  const discount = Math.exp(-r * Math.max(T, 0));
  if (isExpired(sigma, T)) return discount * Math.max(K - F, 0);
  const { d1, d2 } = d1d2(F, K, sigma, T);
  return discount * (K * normCdf(-d2) - F * normCdf(-d1));
}

export type Greeks = {
  /** $ change in option value per $1 move in the futures price */
  delta: number;
  /** Change in delta per $1 move in the futures price */
  gamma: number;
  /** $ change in option value per 1 vol point (e.g. 40 → 41) */
  vega: number;
  /** $ change in option value per calendar day that passes */
  theta: number;
};

/**
 * The four Greeks for a call or put, in the units the site displays:
 * vega per 1 vol point (÷100) and theta per day (÷365).
 */
export function black76Greeks(
  type: OptionType,
  F: number,
  K: number,
  sigma: number,
  T: number,
  r: number,
): Greeks {
  if (isExpired(sigma, T)) {
    const inTheMoney = type === "call" ? F > K : F < K;
    return { delta: inTheMoney ? (type === "call" ? 1 : -1) : 0, gamma: 0, vega: 0, theta: 0 };
  }
  const { d1 } = d1d2(F, K, sigma, T);
  const discount = Math.exp(-r * T);
  const rootT = Math.sqrt(T);
  const price =
    type === "call" ? black76Call(F, K, sigma, T, r) : black76Put(F, K, sigma, T, r);

  const delta = type === "call" ? discount * normCdf(d1) : -discount * normCdf(-d1);
  const gamma = (discount * normPdf(d1)) / (F * sigma * rootT);
  const vegaPerUnit = discount * F * normPdf(d1) * rootT;
  const thetaPerYear = (-discount * F * normPdf(d1) * sigma) / (2 * rootT) + r * price;

  return { delta, gamma, vega: vegaPerUnit / 100, theta: thetaPerYear / 365 };
}

// ---------------------------------------------------------------------------
// Realized vol
// ---------------------------------------------------------------------------

export type PricePoint = {
  close: number;
  /** True when this day's move is a contract roll, not a real price move. */
  roll?: boolean;
};

/**
 * 30-day realized vol, annualized, as a decimal (0.35 = 35%).
 *
 *   RV = √252 · stdev( ln(F_t / F_(t−1)) ) over the last 21 trading days
 *
 * Returns on roll days are skipped. Returns null if there is too little data,
 * or if any price in the window is at or below zero: a log return is
 * undefined there, so no honest vol number exists for that window.
 *
 * Roll days are flagged in lib/feeds.ts as the first trading day after a
 * contract's expiry. Checked against Yahoo on 2026-11-11: CL=F differed from
 * CLZ26.NYM through 2026-10-20 (CLX26's last day) and matched it exactly from
 * 2026-10-21 on, so Yahoo switches CL=F the day after expiry.
 */
export function realizedVol(points: PricePoint[], window = 21): number | null {
  if (points.length < window + 1) return null;
  const recent = points.slice(-(window + 1));
  if (recent.some((p) => p.close <= 0)) return null; // ln() is undefined at or below zero

  const returns: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].roll) continue;
    returns.push(Math.log(recent[i].close / recent[i - 1].close));
  }
  if (returns.length < 2) return null;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(252) * Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// Hedge structures (all per barrel; S = oil price at settlement)
// ---------------------------------------------------------------------------

/** Revenue = h·K_swap + (1 − h)·S, where h is the hedge ratio from 0 to 1. */
export function swapRevenue(hedgeRatio: number, swapPrice: number, S: number): number {
  return hedgeRatio * swapPrice + (1 - hedgeRatio) * S;
}

/**
 * Zero-cost collar: finds the call strike whose premium equals the put's, so
 * selling the call pays for the put. Bisection between F and 3F, stopping
 * when the premium gap is under $0.001. Returns null if no strike in that
 * range works (for example, a put struck above F costs more than any call there).
 */
export function zeroCostCallStrike(
  F: number,
  putStrike: number,
  sigma: number,
  T: number,
  r: number,
): number | null {
  const target = black76Put(F, putStrike, sigma, T, r);
  // The gap is positive when the call is worth more than the put.
  const gap = (strike: number) => black76Call(F, strike, sigma, T, r) - target;
  return bisectCallStrike(gap, F, 3 * F, 0.001);
}

/**
 * Bisection for a call strike: `gap(strike)` is call value minus put value,
 * which falls as the strike rises. Returns null if the answer is not between
 * `low` and `high`.
 */
function bisectCallStrike(
  gap: (strike: number) => number,
  low: number,
  high: number,
  tolerance: number,
): number | null {
  // The answer must sit between a strike where the call is too rich (low)
  // and one where it is too cheap (high).
  if (gap(low) < 0 || gap(high) > 0) return null;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const g = gap(mid);
    if (Math.abs(g) < tolerance) return mid;
    if (g > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** Revenue with a put = S + max(K − S, 0) − premium: a floor at K, minus its cost. */
export function putRevenue(S: number, strike: number, premium: number): number {
  return S + Math.max(strike - S, 0) - premium;
}

/** Collar net premium = Put(K_put) − Call(K_call); positive means Dana pays. */
export function collarNetPremium(
  F: number,
  putStrike: number,
  callStrike: number,
  sigma: number,
  T: number,
  r: number,
): number {
  return black76Put(F, putStrike, sigma, T, r) - black76Call(F, callStrike, sigma, T, r);
}

/**
 * Revenue with a collar = S + max(K_put − S, 0) − max(S − K_call, 0) − net_premium:
 * a floor from the put Dana buys and a ceiling from the call she sells.
 */
export function collarRevenue(
  S: number,
  putStrike: number,
  callStrike: number,
  netPremium: number,
): number {
  return S + Math.max(putStrike - S, 0) - Math.max(S - callStrike, 0) - netPremium;
}

export type ThreeWayStrikes = {
  /** Short put: below this price, protection stops (the "trapdoor") */
  low: number;
  /** Long put: the floor */
  mid: number;
  /** Short call: the ceiling */
  high: number;
};

/** net_premium = Put(K_mid) − Put(K_low) − Call(K_high); positive means Dana pays. */
export function threeWayNetPremium(
  F: number,
  strikes: ThreeWayStrikes,
  sigma: number,
  T: number,
  r: number,
): number {
  return (
    black76Put(F, strikes.mid, sigma, T, r) -
    black76Put(F, strikes.low, sigma, T, r) -
    black76Call(F, strikes.high, sigma, T, r)
  );
}

/**
 * Revenue = S + max(K_mid − S, 0) − max(K_low − S, 0) − max(S − K_high, 0) − net_premium
 */
export function threeWayRevenue(S: number, strikes: ThreeWayStrikes, netPremium: number): number {
  return (
    S +
    Math.max(strikes.mid - S, 0) -
    Math.max(strikes.low - S, 0) -
    Math.max(S - strikes.high, 0) -
    netPremium
  );
}

// ---------------------------------------------------------------------------
// Dana's business and the futures curve
// ---------------------------------------------------------------------------

/** Monthly revenue in $ = barrels sold × price per barrel. */
export function monthlyRevenue(price: number, volume: number): number {
  return price * volume;
}

/** Monthly profit in $ = barrels sold × (price − cost per barrel). */
export function monthlyProfit(price: number, cost: number, volume: number): number {
  return (price - cost) * volume;
}

/** Swap price = the plain average of the contract months (the "strip"). */
export function stripPrice(prices: number[]): number {
  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

/**
 * Curve spread = last month − first month, in $/bbl. Positive means contango
 * (later barrels cost more); negative means backwardation.
 */
export function curveSpread(prices: number[]): number {
  return prices[prices.length - 1] - prices[0];
}

/**
 * Annualized roll yield = (M1 ÷ M_last − 1) × 12 ÷ (months between them).
 * Positive in backwardation: a long position gains as it rolls up the curve.
 */
export function rollYield(prices: number[]): number {
  const monthsApart = prices.length - 1;
  return (prices[0] / prices[prices.length - 1] - 1) * (12 / monthsApart);
}

/**
 * Value in $ of a swap where Dana receives the fixed price and pays the
 * market price: (K_swap − price) × barrels. Not discounted.
 */
export function swapMarkToMarket(swapPrice: number, price: number, barrels: number): number {
  return (swapPrice - price) * barrels;
}

// ---------------------------------------------------------------------------
// Chapter 8: is insurance cheap right now?
// ---------------------------------------------------------------------------

/**
 * Percentile rank from 0 to 100: the share of `values` at or below `x`.
 * 26 means x is higher than (or equal to) 26% of the values.
 */
export function percentileRank(values: number[], x: number): number {
  if (values.length === 0) return NaN;
  return (values.filter((v) => v <= x).length / values.length) * 100;
}

// ---------------------------------------------------------------------------
// Chapter 9: the hedge desk. A structure is a stack of "legs", each running
// for a strip of monthly contracts (month 1 expires in 1 month, and so on).
// ---------------------------------------------------------------------------

export type LegType = "swap" | "longPut" | "shortPut" | "shortCall";

export type Leg = {
  type: LegType;
  /** Strike in $/bbl (for a swap: the fixed price Dana receives) */
  strike: number;
  /** Barrels per month */
  volume: number;
};

/** What the option pricing needs for a strip of monthly contracts. */
export type StripInputs = {
  /** Futures price for each month, nearest first, $/bbl */
  forwards: number[];
  sigma: number;
  r: number;
};

/** Years to expiry of the strip's month at `index` (0 = the nearest month). */
const stripT = (index: number) => (index + 1) / 12;

/**
 * What one leg pays Dana per barrel when oil settles at S:
 *   swap        K − S          (she receives fixed, pays the market)
 *   long put    max(K − S, 0)
 *   short put   −max(K − S, 0)
 *   short call  −max(S − K, 0)
 */
export function legPayoff(leg: Leg, S: number): number {
  switch (leg.type) {
    case "swap":
      return leg.strike - S;
    case "longPut":
      return Math.max(leg.strike - S, 0);
    case "shortPut":
      return Math.min(S - leg.strike, 0); // the same as −max(K − S, 0)
    case "shortCall":
      return Math.min(leg.strike - S, 0); // the same as −max(S − K, 0)
  }
}

/**
 * One leg's premium per barrel for one month. Positive means Dana pays it,
 * negative means she receives it. A swap costs nothing up front.
 */
export function legPremium(leg: Leg, F: number, sigma: number, T: number, r: number): number {
  switch (leg.type) {
    case "swap":
      return 0;
    case "longPut":
      return black76Put(F, leg.strike, sigma, T, r);
    case "shortPut":
      return -black76Put(F, leg.strike, sigma, T, r);
    case "shortCall":
      return -black76Call(F, leg.strike, sigma, T, r);
  }
}

/**
 * One leg's Greeks per barrel for one month, signed for Dana's side of it
 * (a short option flips every sign). A swap is delta −1 and nothing else:
 * it loses $1 for every $1 oil rises.
 */
export function legGreeks(leg: Leg, F: number, sigma: number, T: number, r: number): Greeks {
  if (leg.type === "swap") return { delta: -1, gamma: 0, vega: 0, theta: 0 };
  const g = black76Greeks(leg.type === "shortCall" ? "call" : "put", F, leg.strike, sigma, T, r);
  const sign = leg.type === "longPut" ? 1 : -1;
  return {
    delta: sign * g.delta,
    gamma: sign * g.gamma,
    vega: sign * g.vega,
    theta: sign * g.theta,
  };
}

/** One leg's premium in $ for the whole strip = Σ over months of premium × volume. */
export function legStripPremium(leg: Leg, strip: StripInputs): number {
  return strip.forwards.reduce(
    (sum, F, i) => sum + legPremium(leg, F, strip.sigma, stripT(i), strip.r) * leg.volume,
    0,
  );
}

/** Net premium in $ for all legs over the whole strip; positive means Dana pays. */
export function structurePremium(legs: Leg[], strip: StripInputs): number {
  return legs.reduce((sum, leg) => sum + legStripPremium(leg, strip), 0);
}

/** What all the legs together pay Dana in $ for one month that settles at S. */
export function structurePayoff(legs: Leg[], S: number): number {
  return legs.reduce((sum, leg) => sum + legPayoff(leg, S) * leg.volume, 0);
}

/**
 * Total Greeks across every leg and every month of the strip, scaled by
 * volume: delta in barrels, gamma in barrels per $1, vega in $ per vol point,
 * theta in $ per day.
 */
export function structureGreeks(legs: Leg[], strip: StripInputs): Greeks {
  const total: Greeks = { delta: 0, gamma: 0, vega: 0, theta: 0 };
  for (const leg of legs) {
    strip.forwards.forEach((F, i) => {
      const g = legGreeks(leg, F, strip.sigma, stripT(i), strip.r);
      total.delta += g.delta * leg.volume;
      total.gamma += g.gamma * leg.volume;
      total.vega += g.vega * leg.volume;
      total.theta += g.theta * leg.volume;
    });
  }
  return total;
}

/**
 * Zero-cost collar for a strip: one call strike, used in every month, whose
 * premiums summed over the strip equal the summed premiums of the puts.
 * Same bisection as zeroCostCallStrike, between the strip's average price F
 * and 3F, but run until the total gap is negligible so the collar's net
 * premium rounds to $0. Returns null if no strike in that range works.
 */
export function zeroCostStripCallStrike(strip: StripInputs, putStrike: number): number | null {
  const { forwards, sigma, r } = strip;
  const sumOver = (value: (F: number, T: number) => number) =>
    forwards.reduce((sum, F, i) => sum + value(F, stripT(i)), 0);
  const target = sumOver((F, T) => black76Put(F, putStrike, sigma, T, r));
  const gap = (strike: number) => sumOver((F, T) => black76Call(F, strike, sigma, T, r)) - target;
  const F = stripPrice(forwards);
  return bisectCallStrike(gap, F, 3 * F, 1e-9);
}
