// Describes the shape of market.json and loads/saves it. The site reads market
// data only through this file, so a feed outage can never break a page.

import { promises as fs } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { cacheLife, cacheTag } from "next/cache";
import { realizedVol } from "./pricing";

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
