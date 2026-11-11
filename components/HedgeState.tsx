"use client";
// Holds the hedge the reader builds across chapters 5 to 7 (expiry, put
// strike, call strike, lower put strike) so each chapter starts from the one
// before, and works out the option prices that go with it.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DANA } from "@/lib/dana";
import type { OptionData } from "@/lib/market";
import { black76Call, black76Put } from "@/lib/pricing";

export type Hedge = {
  data: OptionData;

  // What the reader has chosen ------------------------------------------------
  /** Months to expiry, 1 to 12 */
  months: number;
  setMonths: (months: number) => void;
  /** The long put: Dana's floor */
  putStrike: number;
  setPutStrike: (strike: number) => void;
  /** The short call: Dana's ceiling */
  callStrike: number;
  setCallStrike: (strike: number) => void;
  /** The short lower put: where the three-way's protection stops */
  lowStrike: number;
  setLowStrike: (strike: number) => void;

  // Pricing inputs (SPEC "The math") -----------------------------------------
  /** Futures price for the chosen expiry month, $/bbl */
  F: number;
  /** The contract month that price belongs to, "YYYY-MM" */
  contractMonth: string;
  /** Years to expiry = months ÷ 12 */
  T: number;
  /** Implied vol as a decimal = OVX ÷ 100 */
  sigma: number;
  /** Risk-free rate as a decimal = 3-month T-bill ÷ 100 */
  r: number;

  // Slider ranges ------------------------------------------------------------
  callMin: number;
  callMax: number;
  lowMin: number;
  lowMax: number;

  // Premiums at the base vol, $/bbl, rounded to the cent so that every total
  // on screen can be checked by hand from the numbers shown ------------------
  putPremium: number;
  callPremium: number;
  lowPutPremium: number;
  /** Put premium minus call premium; exactly 0 when they match to the cent */
  collarNet: number;
};

const HedgeContext = createContext<Hedge | null>(null);

/** Round to the cent, the smallest step crude options are quoted in. */
export const cents = (value: number) => Math.round(value * 100) / 100;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function HedgeProvider({ data, children }: { data: OptionData; children: ReactNode }) {
  const [months, setMonths] = useState(Math.min(6, data.months.length));
  // Starting strikes come from the futures price for the starting expiry.
  const startF = data.months[months - 1].price;
  const [putStrike, setPutStrike] = useState(Math.round(startF * 0.9));
  const [callChoice, setCallStrike] = useState(Math.round(startF * 1.15));
  const [lowChoice, setLowStrike] = useState(Math.round(startF * 0.75));

  const hedge = useMemo<Hedge>(() => {
    const contract = data.months[months - 1];
    const F = contract.price;
    const T = months / 12;
    const sigma = data.ovx.value / 100;
    const r = data.tbill.value / 100;

    // The call sits at or above both the futures price and the floor, and no
    // higher than 3F, the top of the range the "Make it free" solver searches.
    const callMin = Math.max(Math.floor(F), putStrike);
    const callMax = Math.max(callMin, Math.round(3 * F));
    const callStrike = clamp(callChoice, callMin, callMax);
    // The lower put sits below the floor.
    const lowMin = Math.min(DANA.priceMin, putStrike - 1);
    const lowMax = putStrike - 1;
    const lowStrike = clamp(lowChoice, lowMin, lowMax);

    const putPremium = cents(black76Put(F, putStrike, sigma, T, r));
    const callPremium = cents(black76Call(F, callStrike, sigma, T, r));
    // A solved "free" strike can still land one cent off after rounding, so a
    // gap of a cent or less counts as free.
    const gap = cents(putPremium - callPremium);
    const collarNet = Math.abs(gap) <= 0.01 ? 0 : gap;

    return {
      data,
      months,
      setMonths,
      putStrike,
      setPutStrike,
      callStrike,
      setCallStrike,
      lowStrike,
      setLowStrike,
      F,
      contractMonth: contract.month,
      T,
      sigma,
      r,
      callMin,
      callMax,
      lowMin,
      lowMax,
      putPremium,
      callPremium,
      lowPutPremium: cents(black76Put(F, lowStrike, sigma, T, r)),
      collarNet,
    };
  }, [data, months, putStrike, callChoice, lowChoice]);

  return <HedgeContext.Provider value={hedge}>{children}</HedgeContext.Provider>;
}

/** The hedge the reader is building. Only works inside <HedgeProvider>. */
export function useHedge(): Hedge {
  const hedge = useContext(HedgeContext);
  if (!hedge) throw new Error("useHedge must be used inside <HedgeProvider>");
  return hedge;
}
