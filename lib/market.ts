// Describes the shape of market.json and loads/saves it. The site reads market
// data only through this file, so a feed outage can never break a page.

import { promises as fs } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { cacheLife, cacheTag } from "next/cache";
import { curveSpread, realizedVol, rollYield, stripPrice } from "./pricing";

/** One daily close of the front-month WTI future (Yahoo `CL=F`). */
export type FrontPoint = {
  /** "YYYY-MM-DD" (New York trading date) */
  date: string;
  /** Close in $/bbl */
  close: number;
  /** True on the first day after the front contract expired (see lib/feeds.ts). */
  roll?: boolean;
};

/** One contract month on the futures curve. */
export type CurvePoint = {
  /** Yahoo ticker, e.g. "CLZ26.NYM" */
  ticker: string;
  /** Delivery month, "YYYY-MM" */
  month: string;
  /** Last trading day, "YYYY-MM-DD" */
  expiry: string;
  /** Latest close in $/bbl */
  price: number;
  /** Date of that close */
  date: string;
  /** Close five trading days earlier (the "ghost" curve), if available */
  weekAgo: number | null;
};

/** One observation from a FRED series. */
export type Observation = { date: string; value: number };

export type MarketData = {
  /** Date of the latest front-month close: the site's "as of" date. */
  asOf: string;
  /** When the data job ran (ISO timestamp). */
  generatedAt: string;
  /** About four years of daily front-month closes, oldest first. */
  front: FrontPoint[];
  /** The next 12 contract months, nearest first. */
  curve: CurvePoint[];
  /** FRED DCOILWTICO: WTI spot at Cushing, daily since 1986. */
  wtiSpot: Observation[];
  /** FRED OVXCLS: Cboe crude oil volatility index, daily since 2007. */
  ovx: Observation[];
  /** FRED DTB3: latest 3-month T-bill rate, in percent. */
  tbill3m: Observation;
};

/** Tag used to tell Next.js "market data changed, rebuild pages that use it". */
export const MARKET_TAG = "market";

const BLOB_PATH = "market.json";
const LOCAL_PATH = path.join(process.cwd(), ".data", "market.json");

// On Vercel the file lives in Blob storage. On your laptop (no Blob token) it
// falls back to a local file so the site can be checked before deploying.
const hasBlobToken = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Reads the saved market.json. Returns null if nothing has been saved yet. */
export async function readMarket(): Promise<MarketData | null> {
  if (hasBlobToken()) {
    const result = await get(BLOB_PATH, { access: "public", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return (await new Response(result.stream).json()) as MarketData;
  }
  try {
    return JSON.parse(await fs.readFile(LOCAL_PATH, "utf8")) as MarketData;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** Replaces market.json with new data. Only call this with a complete file. */
export async function writeMarket(market: MarketData): Promise<void> {
  const body = JSON.stringify(market);
  if (hasBlobToken()) {
    await put(BLOB_PATH, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return;
  }
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, body);
}

/**
 * What pages call. The result is cached, and refreshed when the data job
 * finishes (or hourly as a backstop), so visitors never wait on storage.
 */
export async function loadMarket(): Promise<MarketData | null> {
  "use cache";
  cacheTag(MARKET_TAG);
  let market: MarketData | null = null;
  try {
    market = await readMarket();
  } catch (err) {
    console.error("Could not read market.json:", err);
  }
  // Remember good data for hours, but retry soon if nothing was found.
  if (market) cacheLife("hours");
  else cacheLife("minutes");
  return market;
}

/** The numbers the Hero chapter shows, worked out from market.json. */
export type HeroData = {
  asOf: string;
  /** Latest front-month close, $/bbl */
  settle: number;
  /** Change vs. the previous close in $ and as a fraction; null across a roll */
  change: number | null;
  changePct: number | null;
  /** 30-day realized vol as a decimal, or null if there is too little data */
  rv30: number | null;
  /** One year of closes for the sparkline */
  year: { date: string; close: number }[];
  yearLow: number;
  yearHigh: number;
};

export function heroData(market: MarketData): HeroData | null {
  const { front } = market;
  if (front.length < 2) return null;
  const last = front[front.length - 1];
  const prev = front[front.length - 2];

  // Same calendar day one year earlier, e.g. 2026-11-10 → 2025-11-10.
  const yearAgo = `${Number(last.date.slice(0, 4)) - 1}${last.date.slice(4)}`;
  const year = front
    .filter((p) => p.date >= yearAgo)
    .map(({ date, close }) => ({ date, close }));
  const closes = year.map((p) => p.close);

  // A roll-day "change" compares two different contracts, so don't show one.
  const change = last.roll ? null : last.close - prev.close;
  return {
    asOf: last.date,
    settle: last.close,
    change,
    changePct: change === null || prev.close <= 0 ? null : change / prev.close,
    rv30: realizedVol(front),
    year,
    yearLow: Math.min(...closes),
    yearHigh: Math.max(...closes),
  };
}

// ---------------------------------------------------------------------------
// Chapter 2: price history
// ---------------------------------------------------------------------------

/** One pinned event on the history chart. */
export type Callout = {
  key: "crash2008" | "priceWar" | "belowZero" | "ukraine" | "iran";
  /** Where the pin sits on the chart */
  date: string;
  price: number;
  /** Numbers and dates the callout's sentence is filled in with */
  values: Record<string, number>;
  dates: Record<string, string>;
};

export type HistoryData = {
  /** Date of the latest spot price */
  asOf: string;
  /** [date, spot price, 30-day realized vol or null], daily since 2007 */
  rows: [string, number, number | null][];
  callouts: Callout[];
  high: Observation;
  low: Observation;
  /** The highest 30-day realized vol in the series */
  rvMax: Observation;
  /**
   * Stretches of dates with no vol because a price in the 21-day window was
   * at or below zero (log returns are undefined there).
   */
  rvGaps: { from: string; to: string }[];
  /** The highest vol in 2020 outside those gaps, if 2020 is in the data */
  rvMax2020: Observation | null;
};

const highest = (list: Observation[]) =>
  list.reduce((best, o) => (o.value > best.value ? o : best));
const lowest = (list: Observation[]) =>
  list.reduce((best, o) => (o.value < best.value ? o : best));

export function historyData(market: MarketData): HistoryData | null {
  const spot = market.wtiSpot.filter((o) => o.date >= "2007-01-01");
  if (spot.length < 30) return null;
  const between = (from: string, to: string) =>
    spot.filter((o) => o.date >= from && o.date <= to);

  // Rolling 30-day realized vol of the spot price. Spot has no contract
  // rolls. realizedVol() returns null for any window that touches a price at
  // or below zero, which leaves a gap instead of a made-up number.
  const closes = spot.map((o) => ({ close: o.value }));
  const rows: HistoryData["rows"] = spot.map((o, i) => [
    o.date,
    o.value,
    i >= 21 ? realizedVol(closes.slice(i - 21, i + 1)) : null,
  ]);
  const vols = rows.flatMap(([date, , rv]) => (rv === null ? [] : [{ date, value: rv }]));

  // Find each run of missing vol (after the first 21 warm-up days).
  const rvGaps: HistoryData["rvGaps"] = [];
  for (let i = 21; i < rows.length; i++) {
    if (rows[i][2] !== null) continue;
    const from = rows[i][0];
    while (i + 1 < rows.length && rows[i + 1][2] === null) i++;
    rvGaps.push({ from, to: rows[i][0] });
  }
  const vols2020 = vols.filter((v) => v.date.startsWith("2020"));

  // Each event is found in the data, never typed in by hand.
  const callouts: Callout[] = [];

  const y2008 = between("2008-01-01", "2008-12-31");
  if (y2008.length) {
    const peak = highest(y2008);
    const low = lowest(between(peak.date, "2009-06-30"));
    callouts.push({
      key: "crash2008",
      date: peak.date,
      price: peak.value,
      values: { peak: peak.value, low: low.value },
      dates: { peakDate: peak.date, lowDate: low.date },
    });
  }

  const y2014 = between("2014-01-01", "2014-12-31");
  const y2015to16 = between("2015-01-01", "2016-12-31");
  if (y2014.length && y2015to16.length) {
    const peak = highest(y2014);
    const low = lowest(y2015to16);
    callouts.push({
      key: "priceWar",
      date: low.date,
      price: low.value,
      values: { peak: peak.value, low: low.value },
      dates: { peakDate: peak.date, lowDate: low.date },
    });
  }

  const spring2020 = between("2020-03-01", "2020-05-31");
  if (spring2020.length) {
    const low = lowest(spring2020);
    callouts.push({
      key: "belowZero",
      date: low.date,
      price: low.value,
      values: { low: low.value },
      dates: { lowDate: low.date },
    });
  }

  const y2022 = between("2022-01-01", "2022-12-31");
  if (y2022.length) {
    const peak = highest(y2022);
    callouts.push({
      key: "ukraine",
      date: peak.date,
      price: peak.value,
      values: { peak: peak.value },
      dates: { peakDate: peak.date },
    });
  }

  // 2026: pinned on the day the oil fear gauge (OVX) peaked that year.
  const ovx2026 = market.ovx.filter((o) => o.date >= "2026-01-01" && o.date <= "2026-12-31");
  const y2026 = between("2026-01-01", "2026-12-31");
  if (ovx2026.length && y2026.length) {
    const ovxPeak = highest(ovx2026);
    const onDay = [...y2026].reverse().find((o) => o.date <= ovxPeak.date);
    if (onDay) {
      callouts.push({
        key: "iran",
        date: onDay.date,
        price: onDay.value,
        values: { ovx: ovxPeak.value, price: onDay.value, yearHigh: highest(y2026).value },
        dates: { ovxDate: ovxPeak.date, yearHighDate: highest(y2026).date },
      });
    }
  }

  return {
    asOf: spot[spot.length - 1].date,
    rows,
    callouts,
    high: highest(spot),
    low: lowest(spot),
    rvMax: vols.length ? highest(vols) : { date: spot[0].date, value: 0 },
    rvGaps,
    rvMax2020: vols2020.length ? highest(vols2020) : null,
  };
}

// ---------------------------------------------------------------------------
// Chapters 3 and 4: the futures curve and the swap
// ---------------------------------------------------------------------------

export type CurveData = {
  asOf: string;
  points: { month: string; ticker: string; price: number; weekAgo: number | null }[];
  /** Front-month and last-month prices, $/bbl */
  m1: number;
  m12: number;
  /** m12 − m1: positive in contango, negative in backwardation */
  spread: number;
  /** Annualized roll yield as a decimal */
  rollYield: number;
  /** The 12-month strip: the average of the contract months, i.e. the swap price */
  strip: number;
  /** The same average for the curve five trading days earlier, or null if any month is missing */
  stripWeekAgo: number | null;
  shape: "contango" | "backwardation" | "flat";
};

export function curveData(market: MarketData): CurveData | null {
  const { curve } = market;
  if (curve.length < 2) return null;
  const prices = curve.map((c) => c.price);
  const spread = curveSpread(prices);
  const weekAgo = curve.flatMap((c) => (c.weekAgo === null ? [] : [c.weekAgo]));
  const cents = (n: number) => Math.round(n * 100) / 100;
  return {
    asOf: curve[0].date,
    points: curve.map(({ month, ticker, price, weekAgo }) => ({ month, ticker, price, weekAgo })),
    m1: prices[0],
    m12: prices[prices.length - 1],
    spread,
    rollYield: rollYield(prices),
    // Rounded to the cent, the way a swap is quoted, so the math shown on
    // the page can be re-done by hand from the numbers on screen.
    strip: cents(stripPrice(prices)),
    stripWeekAgo: weekAgo.length === curve.length ? cents(stripPrice(weekAgo)) : null,
    shape: spread > 0 ? "contango" : spread < 0 ? "backwardation" : "flat",
  };
}

// ---------------------------------------------------------------------------
// Chapters 5 to 7: option pricing inputs
// ---------------------------------------------------------------------------

export type OptionData = {
  /** Date of the futures prices */
  asOf: string;
  /** Futures price by months to expiry: months[0] expires in 1 month, and so on */
  months: { month: string; price: number }[];
  /** Latest OVX close, in vol points (e.g. 57.2), and its date */
  ovx: Observation;
  /** Latest 3-month T-bill rate, in percent (e.g. 4.06), and its date */
  tbill: Observation;
};

export function optionData(market: MarketData): OptionData | null {
  const { curve, ovx, tbill3m } = market;
  if (curve.length === 0 || ovx.length === 0 || !tbill3m) return null;
  return {
    asOf: curve[0].date,
    months: curve.map(({ month, price }) => ({ month, price })),
    ovx: ovx[ovx.length - 1],
    tbill: tbill3m,
  };
}
