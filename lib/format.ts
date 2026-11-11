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

/** Big totals in short form for chart axes: $1.25M, $800k or ($200k). */
export const compactDollars = (n: number) => {
  const abs = Math.abs(n);
  if (abs < 500) return "$0";
  const text =
    abs >= 1e6 ? `$${Number((abs / 1e6).toFixed(2))}M` : `$${Number((abs / 1e3).toFixed(0))}k`;
  return n < 0 ? `(${text})` : text;
};

/** Barrels in Desk shorthand: 10,000 → 10k, 2,500 → 2.5k, 750 → 750. */
export const compactVolume = (n: number) =>
  n >= 1000 ? `${Number((n / 1000).toFixed(2))}k` : String(n);

/** 1 → 1st, 2 → 2nd, 26 → 26th. */
export const ordinal = (n: number) => {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
};

/** A market price, which can genuinely be negative: $86.04 or −$36.98. */
export const price = (n: number) => (n < 0 ? `${MINUS}${money(n, 2)}` : money(n, 2));

/** A short price for tight spots like chart labels: $72 or $90.90. */
export const priceShort = (n: number) =>
  Number.isInteger(n) ? `${n < 0 ? MINUS : ""}$${Math.abs(n)}` : price(n);

/** A bare strike for Desk shorthand like "collar 72/90.90". */
export const strikeText = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** A price difference with its sign always shown: +$1.20 or −$12.19. */
export const signedPrice = (n: number) => `${n < 0 ? MINUS : "+"}${money(n, 2)}`;

/** A plain decimal with a true minus sign: −0.3207. */
export const decimal = (n: number, digits: number) =>
  `${n < 0 ? MINUS : ""}${Math.abs(n).toFixed(digits)}`;

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
