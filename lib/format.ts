// Turns raw numbers and dates into the text the site shows, in one place so
// every chapter formats money and dates the same way.

// A true minus sign, followed by an invisible "word joiner" so a line can
// never break between the sign and its number.
const MINUS = "−\u2060";

const money = (n: number, digits: number) =>
  Math.abs(n).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/** Money with cents; losses in parentheses: $1,234.56 or ($1,234.56). */
export const usd = (n: number) => (n < 0 ? `(${money(n, 2)})` : money(n, 2));

/** Whole-dollar totals; losses in parentheses: $310,000 or ($150,000). */
export const dollars = (n: number) => (n < 0 ? `(${money(n, 0)})` : money(n, 0));

/** A market price, which can genuinely be negative: $86.04 or −$36.98. */
export const price = (n: number) => (n < 0 ? `${MINUS}${money(n, 2)}` : money(n, 2));

/** A price difference with its sign always shown: +$1.20 or −$12.19. */
export const signedPrice = (n: number) => `${n < 0 ? MINUS : "+"}${money(n, 2)}`;

/** A fraction as a percent: 0.551 → 55.1%. */
export const pct = (n: number, digits = 1) =>
  `${n < 0 ? MINUS : ""}${(Math.abs(n) * 100).toFixed(digits)}%`;

/** A percent with its sign always shown: +18.0% or −0.93%. */
export const signedPct = (n: number, digits = 1) =>
  `${n < 0 ? MINUS : "+"}${(Math.abs(n) * 100).toFixed(digits)}%`;

function formatDate(isoDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    ...options,
  });
}

/** "2026-11-10" → "November 10, 2026" */
export const longDate = (isoDate: string) =>
  formatDate(isoDate, { year: "numeric", month: "long", day: "numeric" });

/** "2026-11-10" → "Nov 10, 2026" */
export const shortDate = (isoDate: string) =>
  formatDate(isoDate, { year: "numeric", month: "short", day: "numeric" });

/** "2026-11-10" or "2026-11" → "November 2026" */
export const monthYear = (isoDate: string) =>
  formatDate(`${isoDate.slice(0, 7)}-01`, { year: "numeric", month: "long" });

/** "2026-12" → "Dec" */
export const monthShort = (isoMonth: string) =>
  formatDate(`${isoMonth.slice(0, 7)}-01`, { month: "short" });
