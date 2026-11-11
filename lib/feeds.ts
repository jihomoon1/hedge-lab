// Talks to the outside world: pulls WTI futures from Yahoo Finance and three
// series from FRED, cleans the numbers, and assembles one MarketData object.
// Every function throws on bad or missing data, so the caller can keep the old file.

import YahooFinance from "yahoo-finance2";
import { expiriesBetween, nextContracts } from "./contracts";
import type { CurvePoint, FrontPoint, MarketData, Observation } from "./market";

const DAY_MS = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** A calendar date in New York (where NYMEX trades), as "YYYY-MM-DD". */
export function newYorkDate(d: Date): string {
  // The "en-CA" locale happens to format dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
}

type RawBar = { date: Date; close?: number | null };

/**
 * Turns Yahoo's daily bars into clean { date, close } rows, oldest first.
 * Bars dated `today` or later are dropped: that session is still trading, so
 * its "close" is just the latest trade, not a settlement price.
 */
export function cleanBars(bars: RawBar[], today: string): { date: string; close: number }[] {
  const byDate = new Map<string, number>();
  for (const bar of bars) {
    if (typeof bar.close !== "number" || !Number.isFinite(bar.close)) continue;
    const date = newYorkDate(bar.date);
    if (date >= today) continue;
    byDate.set(date, round2(bar.close));
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, close]) => ({ date, close }));
}

/**
 * Flags the first bar after each contract expiry. Yahoo's `CL=F` switches to
 * the next contract there, so that day's "move" is a roll, not a real return.
 */
export function markRolls(points: { date: string; close: number }[]): FrontPoint[] {
  if (points.length === 0) return [];
  const expiries = expiriesBetween(points[0].date, points[points.length - 1].date);
  return points.map((point, i) => {
    if (i === 0) return point;
    const prevDate = points[i - 1].date;
    const rolled = expiries.some((e) => prevDate <= e && e < point.date);
    return rolled ? { ...point, roll: true } : point;
  });
}

type FredResponse = { observations?: { date: string; value: string }[] };

/** FRED marks missing days with "."; this keeps only real numbers. */
export function parseFredObservations(json: FredResponse): Observation[] {
  const out: Observation[] = [];
  for (const obs of json.observations ?? []) {
    const value = Number(obs.value);
    if (obs.value.trim() === "" || !Number.isFinite(value)) continue;
    out.push({ date: obs.date, value });
  }
  return out;
}

async function fetchFred(seriesId: string, start: string, apiKey: string): Promise<Observation[]> {
  const url = new URL("https://api.stlouisfed.org/fred/series/observations");
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("observation_start", start);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`FRED ${seriesId}: HTTP ${res.status}`);
  const observations = parseFredObservations((await res.json()) as FredResponse);
  if (observations.length === 0) throw new Error(`FRED ${seriesId}: no observations`);
  return observations;
}

async function fetchFront(yahoo: InstanceType<typeof YahooFinance>, now: Date): Promise<FrontPoint[]> {
  const today = newYorkDate(now);
  const result = await yahoo.chart("CL=F", {
    period1: new Date(now.getTime() - 4 * 366 * DAY_MS),
    interval: "1d",
  });
  const points = cleanBars(result.quotes, today);
  if (points.length < 250) {
    throw new Error(`Yahoo CL=F: only ${points.length} daily closes (need at least 250)`);
  }
  const ageDays = (Date.parse(today) - Date.parse(points[points.length - 1].date)) / DAY_MS;
  if (ageDays > 7) throw new Error(`Yahoo CL=F: latest close is ${ageDays} days old`);
  return markRolls(points);
}

async function fetchCurve(
  yahoo: InstanceType<typeof YahooFinance>,
  now: Date,
  asOf: string,
): Promise<CurvePoint[]> {
  const today = newYorkDate(now);
  // The contracts still trading on the as-of date, e.g. CLZ26.NYM ... CLX27.NYM.
  const contracts = nextContracts(asOf, 12);
  return Promise.all(
    contracts.map(async (contract) => {
      const result = await yahoo.chart(contract.ticker, {
        period1: new Date(now.getTime() - 21 * DAY_MS),
        interval: "1d",
      });
      const bars = cleanBars(result.quotes, today);
      const last = bars[bars.length - 1];
      if (!last) throw new Error(`Yahoo ${contract.ticker}: no closes`);
      if ((Date.parse(asOf) - Date.parse(last.date)) / DAY_MS > 5) {
        throw new Error(`Yahoo ${contract.ticker}: latest close ${last.date} is stale`);
      }
      const weekAgo = bars.length >= 6 ? bars[bars.length - 6].close : null;
      return { ...contract, price: last.close, date: last.date, weekAgo };
    }),
  );
}

/**
 * Fetches all four feeds and returns a complete MarketData object.
 * If any single feed fails, the whole thing throws and nothing is returned.
 */
export async function buildMarket(now = new Date()): Promise<MarketData> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error("FRED_API_KEY is not set");

  const yahoo = new YahooFinance();
  const recent = newYorkDate(new Date(now.getTime() - 30 * DAY_MS));

  const [front, wtiSpot, ovx, tbill] = await Promise.all([
    fetchFront(yahoo, now),
    fetchFred("DCOILWTICO", "1986-01-02", apiKey),
    fetchFred("OVXCLS", "2007-05-10", apiKey),
    fetchFred("DTB3", recent, apiKey),
  ]);
  const asOf = front[front.length - 1].date;
  const curve = await fetchCurve(yahoo, now, asOf);

  return {
    asOf,
    generatedAt: now.toISOString(),
    front,
    curve,
    wtiSpot,
    ovx,
    tbill3m: tbill[tbill.length - 1],
  };
}
