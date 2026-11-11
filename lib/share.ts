// Turns a hedge (a list of legs) into a short piece of text that fits in a
// web address, and back again, so a link can reopen the exact hedge.
//
// Format: one leg is type_strike_volume, legs are joined by "-".
//   sw_79.42_5000-lp_71_10000   = a swap on 5,000 bbl plus a long 71 put on 10,000

import type { Leg, LegType } from "./pricing";

/** The name of the query-string key: https://…/?legs=… */
export const LEGS_PARAM = "legs";
export const MAX_LEGS = 6;
/** Limits on what a link (or the inputs) may contain */
export const MAX_STRIKE = 1000;
export const MAX_VOLUME = 1_000_000;

const CODES: Record<LegType, string> = {
  swap: "sw",
  longPut: "lp",
  shortPut: "sp",
  shortCall: "sc",
};
const TYPES = Object.fromEntries(
  Object.entries(CODES).map(([type, code]) => [code, type as LegType]),
);

/** Strikes are kept to 6 decimals, which is exact enough to rebuild a solved strike. */
export const roundStrike = (strike: number) => Math.round(strike * 1e6) / 1e6;

/** True if a leg's numbers are ones the sandbox accepts. */
export function isValidLeg(leg: Leg): boolean {
  return (
    leg.type in CODES &&
    Number.isFinite(leg.strike) &&
    leg.strike > 0 &&
    leg.strike <= MAX_STRIKE &&
    Number.isFinite(leg.volume) &&
    leg.volume >= 0 &&
    leg.volume <= MAX_VOLUME
  );
}

/** What an empty hedge (every leg removed) is written as. */
const EMPTY = "none";

/** Legs → text for the address bar. */
export function encodeLegs(legs: Leg[]): string {
  if (legs.length === 0) return EMPTY;
  return legs
    .map((leg) => `${CODES[leg.type]}_${roundStrike(leg.strike)}_${leg.volume}`)
    .join("-");
}

/**
 * Text from the address bar → legs. Returns null if any part of it is not a
 * valid leg, so a broken or tampered link falls back to the default hedge
 * instead of showing nonsense.
 */
export function decodeLegs(text: string | null | undefined): Leg[] | null {
  if (!text) return null;
  if (text === EMPTY) return [];
  const parts = text.split("-");
  if (parts.length > MAX_LEGS) return null;
  const legs: Leg[] = [];
  for (const part of parts) {
    const fields = part.split("_");
    if (fields.length !== 3) return null;
    const [code, strikeText, volumeText] = fields;
    const type = TYPES[code];
    if (!type || !/^\d+(\.\d+)?$/.test(strikeText) || !/^\d+(\.\d+)?$/.test(volumeText)) {
      return null;
    }
    const leg: Leg = { type, strike: Number(strikeText), volume: Number(volumeText) };
    if (!isValidLeg(leg)) return null;
    legs.push(leg);
  }
  return legs;
}
