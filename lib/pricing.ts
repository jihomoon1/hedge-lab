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
 * Returns on roll days are skipped. Returns null if there is too little data.
 *
 * Roll days are flagged in lib/feeds.ts as the first trading day after a
 * contract's expiry. Checked against Yahoo on 2026-11-11: CL=F differed from
 * CLZ26.NYM through 2026-10-20 (CLX26's last day) and matched it exactly from
 * 2026-10-21 on, so Yahoo switches CL=F the day after expiry.
 */
export function realizedVol(points: PricePoint[], window = 21): number | null {
  if (points.length < window + 1) return null;
  const recent = points.slice(-(window + 1));

  const returns: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1].close;
    const cur = recent[i].close;
    if (recent[i].roll) continue;
    if (prev <= 0 || cur <= 0) continue; // ln() is undefined at or below zero
    returns.push(Math.log(cur / prev));
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

  let low = F;
  let high = 3 * F;
  // Call value falls as the strike rises, so the answer must sit between a
  // strike where the call is too rich (low) and one where it is too cheap (high).
  if (gap(low) < 0 || gap(high) > 0) return null;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const g = gap(mid);
    if (Math.abs(g) < 0.001) return mid;
    if (g > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
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
