// Every word the site shows, by chapter, in both vocabularies. Rewrite the
// text here without touching any component. {curly} words are filled in from data.

export type Mode = "plain" | "desk";

export const copy = {
  hero: {
    plain: {
      eyebrow: "A barrel of U.S. crude oil",
      unit: "per barrel",
      asOf: "Closing price on {date}. Updated once a day, not live.",
      chartTitle:
        "Over the past year, a barrel has sold for as little as {low} and as much as {high}.",
      question: "If you had to sell your oil at this price, could you sleep tonight?",
    },
    desk: {
      eyebrow: "WTI front month · CL=F",
      unit: "$/bbl",
      asOf: "Settle {date} · end-of-day, not tick data",
      chartTitle: "1Y range {low} – {high}",
      question: "If you had to sell your oil at this price, could you sleep tonight?",
      dayChange: "Day chg",
      dayChangeRolled: "n/a (contract roll)",
      realizedVol: "30-day RV, annualized",
    },
    chartLabel: "WTI front-month closing price, {start} to {end}",
    noData: {
      title: "No market data yet",
      body: "The daily data job has not saved a market.json file. Run it once by visiting /api/refresh, then reload this page.",
    },
  },
} as const;

/** Replaces {name} placeholders: fill("Hi {who}", { who: "Dana" }) → "Hi Dana". */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
