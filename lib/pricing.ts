// All the site's math lives here (SPEC "The math"). Phase 1 only needs realized
// vol for the Hero; Black-76, Greeks and the collar solver arrive in phase 2.

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
