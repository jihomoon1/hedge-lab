// The story's fixed assumptions about Dana, kept in one place so every
// chapter uses the same numbers.

export const DANA = {
  /** Barrels she sells each month */
  volume: 10_000,
  /** Her cost to produce a barrel, $/bbl. Illustrative, and editable in chapter 1. */
  defaultCost: 55,
  /** The range of the oil price sliders and payoff charts, $/bbl */
  priceMin: 20,
  priceMax: 130,
} as const;
