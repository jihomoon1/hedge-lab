// Builds NYMEX WTI contract tickers (like CLZ26.NYM) and works out when each
// contract stops trading, so the data job knows which 12 months are "next".

/** Month codes used by futures exchanges: F = Jan ... Z = Dec. */
const MONTH_CODES = "FGHJKMNQUVXZ";

const DAY_MS = 86_400_000;

export type Contract = {
  /** Yahoo ticker, e.g. "CLZ26.NYM" */
  ticker: string;
  /** Delivery month as "YYYY-MM", e.g. "2026-12" */
  month: string;
  /** Last trading day as "YYYY-MM-DD" */
  expiry: string;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, monthIndex: number, day: number) =>
  new Date(Date.UTC(y, monthIndex, day));

/** "CL" + month code + two-digit year + ".NYM". `month` is 1–12. */
export function contractTicker(year: number, month: number): string {
  const yy = String(year % 100).padStart(2, "0");
  return `CL${MONTH_CODES[month - 1]}${yy}.NYM`;
}

/** Easter Sunday (Gregorian calendar), needed to find Good Friday. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month - 1, day);
}

/** The n-th given weekday of a month (weekday: 0 = Sunday ... 6 = Saturday). */
function nthWeekday(year: number, monthIndex: number, weekday: number, n: number): Date {
  const first = utc(year, monthIndex, 1);
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return utc(year, monthIndex, 1 + offset + (n - 1) * 7);
}

/** If a fixed-date holiday lands on a weekend, markets close the nearest weekday. */
function observed(d: Date): Date {
  const dow = d.getUTCDay();
  if (dow === 6) return new Date(d.getTime() - DAY_MS);
  if (dow === 0) return new Date(d.getTime() + DAY_MS);
  return d;
}

/**
 * The exchange holidays that can fall near the 25th of a month. (New Year's,
 * July 4 and Labor Day never land in the days this file looks at.)
 */
function holidays(year: number): Set<string> {
  const days = [
    nthWeekday(year, 0, 1, 3), // Martin Luther King Jr. Day
    nthWeekday(year, 1, 1, 3), // Presidents' Day
    new Date(easterSunday(year).getTime() - 2 * DAY_MS), // Good Friday
    observed(utc(year, 11, 25)), // Christmas
    nthWeekday(year, 10, 4, 4), // Thanksgiving
  ];
  // Memorial Day: the last Monday of May.
  const may31 = utc(year, 4, 31);
  days.push(new Date(may31.getTime() - ((may31.getUTCDay() + 6) % 7) * DAY_MS));
  if (year >= 2022) days.push(observed(utc(year, 5, 19))); // Juneteenth
  return new Set(days.map(iso));
}

function isBusinessDay(d: Date): boolean {
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !holidays(d.getUTCFullYear()).has(iso(d));
}

/**
 * Last trading day of a WTI contract. CME rule: trading stops 3 business days
 * before the 25th of the month before delivery (4 if the 25th itself is not a
 * business day). `month` is the delivery month, 1–12.
 */
export function lastTradeDate(year: number, month: number): string {
  let d = utc(year, month - 2, 25);
  let stepsLeft = isBusinessDay(d) ? 3 : 4;
  while (stepsLeft > 0) {
    d = new Date(d.getTime() - DAY_MS);
    if (isBusinessDay(d)) stepsLeft--;
  }
  return iso(d);
}

/**
 * The next `count` contracts still trading on `today` ("YYYY-MM-DD"),
 * nearest delivery month first.
 */
export function nextContracts(today: string, count = 12): Contract[] {
  let year = Number(today.slice(0, 4));
  let month = Number(today.slice(5, 7));
  const out: Contract[] = [];
  while (out.length < count) {
    const expiry = lastTradeDate(year, month);
    if (expiry >= today) {
      out.push({
        ticker: contractTicker(year, month),
        month: `${year}-${String(month).padStart(2, "0")}`,
        expiry,
      });
    }
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return out;
}

/** Every contract expiry date from `from` to `to` (both "YYYY-MM-DD", inclusive). */
export function expiriesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  for (;;) {
    const expiry = lastTradeDate(year, month);
    if (expiry > to) break;
    if (expiry >= from) out.push(expiry);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return out;
}
