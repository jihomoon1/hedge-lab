// Every word the site shows, by chapter, in both vocabularies. Rewrite the
// text here without touching any component.
//
// Three bits of markup work inside the strings:
//   {name}            filled in from live data, e.g. {price}
//   **words**         bold
//   [[term]]          an underlined term with a hover definition; shows the
//                     term's plain or desk name. [[term|other words]] shows
//                     your own words instead.

export type Mode = "plain" | "desk";

/** The name the reader's mode choice is saved under in their browser. */
export const MODE_STORAGE_KEY = "hedge-lab-mode";

/** Replaces {name} placeholders: fill("Hi {who}", { who: "Dana" }) → "Hi Dana". */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

// ---------------------------------------------------------------------------
// Terms: the Plain English ↔ Desk Speak table from SPEC.md, plus a
// one-line definition shown on hover or tap.
// ---------------------------------------------------------------------------

export const terms = {
  wti: {
    plain: "U.S. crude oil",
    desk: "WTI",
    def: "West Texas Intermediate: the benchmark grade of U.S. crude oil, priced for delivery at Cushing, Oklahoma.",
  },
  futures: {
    plain: "a price agreed today for oil delivered later",
    desk: "futures",
    def: "A contract to buy or sell oil in a set future month at a price fixed today.",
  },
  frontMonth: {
    plain: "the nearest delivery month",
    desk: "front month (M1)",
    def: "The futures contract closest to delivery; its price is the one usually quoted as 'the oil price'.",
  },
  breakeven: {
    plain: "the price where Dana makes nothing",
    desk: "breakeven",
    def: "The oil price at which revenue exactly covers cost, so profit is zero.",
  },
  delta: {
    plain: "how much Dana's income moves when oil moves $1",
    desk: "Δ",
    def: "Delta: the dollar change in a position's value for a $1 change in the oil price.",
  },
  realizedVol: {
    plain: "how jumpy oil has actually been",
    desk: "30-day RV, annualized",
    def: "Realized volatility: the size of oil's actual daily moves over the last 30 days, scaled to a yearly rate.",
  },
  contango: {
    plain: "future barrels cost more than today's",
    desk: "contango",
    def: "A futures curve that slopes up: oil for later delivery costs more than oil for delivery now.",
  },
  backwardation: {
    plain: "today's barrels cost more than future ones",
    desk: "backwardation",
    def: "A futures curve that slopes down: oil for delivery now costs more than oil for later delivery.",
  },
  rollYield: {
    plain: "what the curve's slope pays or costs each year",
    desk: "roll yield",
    def: "The yearly gain or loss from holding futures as they move along a sloped curve toward delivery.",
  },
  swap: {
    plain: "lock in a price",
    desk: "fixed-for-floating swap",
    def: "A deal where Dana receives a fixed price for her oil and gives up whatever the market price turns out to be.",
  },
  strip: {
    plain: "the average price of the next 12 months",
    desk: "12-month strip",
    def: "The average of the next 12 monthly futures prices: the fixed price a one-year swap is struck at.",
  },
  hedgeRatio: {
    plain: "the share of her oil Dana locks in",
    desk: "hedge ratio (h)",
    def: "The fraction of production covered by the hedge, from 0% (none) to 100% (all of it).",
  },
  markToMarket: {
    plain: "what the deal is worth right now",
    desk: "mark-to-market (MtM)",
    def: "The gain or loss on a hedge if it were valued at current market prices today.",
  },
} as const;

export type TermKey = keyof typeof terms;

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

export const copy = {
  toggle: {
    label: "Vocabulary",
    plain: "Plain English",
    desk: "Desk Speak",
    /** Shorter labels for the switch on narrow phone screens. */
    plainShort: "Plain",
    deskShort: "Desk",
  },

  /** Shared bits used under several charts. */
  common: {
    asOf: "As of {date}",
    illustrative: "illustrative",
    perBarrel: "$/bbl",
  },

  // 0. Hero ----------------------------------------------------------------
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

  // 1. Meet Dana -----------------------------------------------------------
  dana: {
    plain: {
      kicker: "Chapter 1 · Meet Dana",
      title: "Dana sells 10,000 barrels a month, at whatever price the market gives her.",
      body: [
        "Dana runs a small oil producer in West Texas. Her wells pump 10,000 barrels a month, and each barrel costs her about {cost} to produce.",
        "Drag the price and watch her month change. **Every $10 move in oil is {tenDollarMove} a month to Dana.** Below [[breakeven|her breakeven]], every barrel she sells loses money.",
      ],
      chartProfit: "At {price} a barrel, Dana clears {profit} a month.",
      chartLoss: "At {price} a barrel, Dana loses {loss} a month.",
      chartEven: "At {price} a barrel, Dana makes nothing.",
      priceLabel: "Oil price",
      costLabel: "Dana's cost to produce a barrel",
      revenue: "Revenue",
      cost: "Cost",
      profit: "Profit",
      loss: "Loss",
      breakevenMark: "Breakeven {cost}",
      footnote:
        "Slider starts at the WTI close on {date} ({today}), rounded to the dollar. Dana and her {cost} cost are illustrative.",
      aha: "Dana is not in the oil business; she is in the oil price business.",
    },
    desk: {
      kicker: "01 · Exposure",
      title: "Unhedged producer: long 10,000 bbl/month, fully exposed to flat price.",
      body: [
        "Dana's production is a natural long: 10,000 bbl/month with lifting cost of {cost}/bbl. Her P&L is linear in the [[wti]] price.",
        "Her [[delta]] is {delta} of P&L per $1.00. Margin turns negative below [[breakeven]] at {cost}.",
      ],
      chartProfit: "WTI {price}: monthly P&L {profit}.",
      chartLoss: "WTI {price}: monthly P&L {loss}.",
      chartEven: "WTI {price}: monthly P&L flat at breakeven.",
      priceLabel: "WTI, $/bbl",
      costLabel: "Lifting cost, $/bbl",
      revenue: "Revenue",
      cost: "Cost",
      profit: "P&L",
      loss: "P&L",
      breakevenMark: "B/E {cost}",
      footnote:
        "Slider initialised at CL=F settle {date} ({today}), rounded to $1. Cost basis {cost} is illustrative.",
      aha: "Dana is not in the oil business; she is in the oil price business.",
    },
    desk_stats: {
      exposure: "Exposure",
      exposureValue: "Long {volume} bbl/month",
      delta: "Δ",
      deltaValue: "{delta} P&L per $1.00",
      margin: "Margin",
      marginValue: "{margin}/bbl",
    },
  },

  // 2. Oil's mood swings ---------------------------------------------------
  history: {
    plain: {
      kicker: "Chapter 2 · Oil's mood swings",
      title: "The price Dana lives on has never sat still.",
      body: [
        "This is the daily price of [[wti]] since 2007. Press Play and watch it run. It has topped {high} and, for one day in 2020, fallen below zero.",
        "Each numbered pin is a moment when the price moved faster than any producer could react.",
      ],
      chartTitle: "Since 2007, a barrel of oil has cost as much as {high} and as little as {low}.",
      play: "Play",
      replay: "Play again",
      playing: "Playing…",
      through: "Through {year}",
      priceSeries: "Oil price",
      volSeries: "30-day realized vol",
      footnote: "As of {date}. Daily WTI spot price at Cushing, Oklahoma. Source: FRED series DCOILWTICO.",
      aha: "Price risk is not hypothetical; it has bankrupted producers.",
    },
    desk: {
      kicker: "02 · Price history",
      title: "WTI spot since 2007: fat tails and vol that clusters.",
      body: [
        "Daily [[wti]] spot at Cushing. Range since 2007: {low} to {high}. The lower panel is [[realizedVol]] on its own axis; it peaked at {rvMax} on {rvMaxDate}.",
        "Vol clusters: each pinned event shows up as a spike in the lower panel, not a single bad day.",
      ],
      chartTitle: "WTI spot range {low} to {high}; 30-day RV peaked at {rvMax}.",
      play: "Play",
      replay: "Replay",
      playing: "Playing…",
      through: "Through {year}",
      priceSeries: "WTI spot, $/bbl",
      volSeries: "30-day RV, annualized",
      footnote:
        "As of {date}. FRED DCOILWTICO (EIA Cushing spot). RV = √252 · stdev of daily log returns over 21 trading days; days at or below zero are skipped.",
      aha: "Price risk is not hypothetical; it has bankrupted producers.",
    },
    /** The five pinned events. Numbers and dates are filled in from the data. */
    callouts: {
      crash2008: {
        plain: {
          title: "2008: spike and crash",
          text: "Oil peaked at {peak} on {peakDate}, then fell to {low} by {lowDate} as the financial crisis hit demand.",
        },
        desk: {
          title: "2008 spike and crash",
          text: "High {peak} ({peakDate}), low {low} ({lowDate}).",
        },
      },
      priceWar: {
        plain: {
          title: "2014–16: OPEC price war",
          text: "From {peak} in {peakDateMonth} to {low} on {lowDate}, as OPEC kept pumping into a glut.",
        },
        desk: {
          title: "2014–16 OPEC price war",
          text: "{peak} ({peakDate}) to {low} ({lowDate}).",
        },
      },
      belowZero: {
        plain: {
          title: "April 2020: below zero",
          text: "On {lowDate}, with pandemic demand gone and storage nearly full, the price went to {low}. Sellers paid buyers to take oil away.",
        },
        desk: {
          title: "April 2020: front-month WTI below zero",
          text: "Spot printed {low} on {lowDate} as the expiring front month went negative into full storage at Cushing.",
        },
      },
      ukraine: {
        plain: {
          title: "2022: Russia invades Ukraine",
          text: "Oil jumped to {peak} on {peakDate}, days after the invasion.",
        },
        desk: {
          title: "2022 spike after Russia invaded Ukraine",
          text: "High {peak} on {peakDate}.",
        },
      },
      iran: {
        plain: {
          title: "2026: strikes on Iran",
          text: "During the U.S.-Israeli strikes on Iran, the market's fear gauge for oil peaked on {ovxDate}, with oil at {price}. Oil went on to {yearHigh} on {yearHighDate}.",
        },
        desk: {
          title: "2026 vol spike: U.S.-Israeli strikes on Iran",
          text: "OVX peaked at {ovx} on {ovxDate} with spot at {price}; year high {yearHigh} ({yearHighDate}).",
        },
      },
    },
  },

  // 3. The futures curve ---------------------------------------------------
  curve: {
    plain: {
      kicker: "Chapter 3 · The futures curve",
      title: "Oil has a different price for every month you want it delivered.",
      body: [
        "Dana doesn't have to take whatever price shows up next month. Buyers will agree [[futures|a price today]] for oil she delivers later. Line those prices up by month and you get a curve.",
        "{shapeSentence}",
      ],
      contango:
        "Today the market pays more for oil delivered later than oil delivered now: [[contango|future barrels cost more than today's]]. Storing oil pays, so the tank fills.",
      backwardation:
        "Today the market pays more for oil delivered now than oil delivered later: [[backwardation|today's barrels cost more than future ones]]. Selling now pays, so the tank drains.",
      flat: "Today the market pays about the same for oil delivered now and oil delivered later.",
      chartContango:
        "Oil for delivery in {m1Month} costs {m1}; oil for {m12Month} costs {m12}, or {gap} more.",
      chartBackwardation:
        "Oil for delivery in {m1Month} costs {m1}; oil for {m12Month} costs {m12}, or {gap} less.",
      chartFlat: "Oil costs about {m1} whether it is delivered in {m1Month} or {m12Month}.",
      today: "Today ({date})",
      weekAgo: "A week earlier",
      priceLabel: "Price",
      weekAgoLabel: "Week earlier",
      tankFilling: "Storage tank: filling",
      tankDraining: "Storage tank: draining",
      tankFlat: "Storage tank: steady",
      footnote:
        "As of {date}. Closing prices of the next 12 monthly WTI futures contracts. Source: Yahoo Finance. End-of-day, not live.",
      aha: "A futures price is not a forecast; it is a price you can lock in today.",
    },
    desk: {
      kicker: "03 · Term structure",
      title: "WTI term structure, M1 to M12.",
      body: [
        "Settles for the next 12 NYMEX WTI contracts, with the curve from five sessions earlier as the ghost line.",
        "{shapeSentence}",
      ],
      contango:
        "[[contango|Contango]], M1–M12 spread {spread}. The curve pays to store: [[rollYield]] for a long is {rollYield} annualized.",
      backwardation:
        "[[backwardation|Backwardation]], M1–M12 spread {spread}. Prompt barrels carry a premium: [[rollYield]] for a long is {rollYield} annualized.",
      flat: "Flat curve, M1–M12 spread {spread}.",
      chartContango: "Contango: M1 {m1}, M12 {m12}, spread {spread}.",
      chartBackwardation: "Backwardation: M1 {m1}, M12 {m12}, spread {spread}.",
      chartFlat: "Flat: M1 {m1}, M12 {m12}.",
      today: "Settle {date}",
      weekAgo: "T−5 sessions",
      priceLabel: "Settle",
      weekAgoLabel: "T−5",
      tankFilling: "Storage: building",
      tankDraining: "Storage: drawing",
      tankFlat: "Storage: flat",
      footnote:
        "As of {date}. NYMEX CL contract settles via Yahoo Finance, end-of-day. Roll yield = (M1 ÷ M12 − 1) × 12/11.",
      aha: "A futures price is not a forecast; it is a price you can lock in today.",
    },
    desk_stats: {
      spread: "M1–M12 spread",
      rollYield: "Roll yield, ann.",
      strip: "12-month strip",
    },
  },

  // 4. The swap ------------------------------------------------------------
  swap: {
    plain: {
      kicker: "Chapter 4 · Lock it in",
      title: "Dana can trade an unknown price for a known one.",
      body: [
        "The simplest hedge is to [[swap]]. A bank agrees to pay Dana {strip} a barrel for the next year, [[strip]]. Whatever the market does, that is her price.",
        "She doesn't have to lock in everything. Slide [[hedgeRatio|the share she locks in]] and watch her line tilt between the steep one (no hedge) and the flat one (fully locked).",
      ],
      chartNone: "With nothing locked in, every dollar oil moves is a dollar on Dana's price.",
      chartPartial: "With {hedged} locked in at {strip}, Dana still feels {open} of every price move.",
      chartFull: "Fully locked in, Dana gets {strip} a barrel wherever oil ends up.",
      sliderLabel: "Share of oil locked in",
      unhedged: "No hedge",
      fullSwap: "100% locked in at {strip}",
      dana: "Dana's price at {hedged} locked in",
      xLabel: "Oil price when Dana sells ($ per barrel)",
      yLabel: "What Dana receives ($ per barrel)",
      todayMark: "Today {today}",
      tableTitle: "Dana's monthly revenue",
      tableScenario: "If oil ends up at",
      tableUnhedged: "No hedge",
      tableHedged: "With this hedge",
      footnote:
        "As of {date}. Locked-in price is the average close of the next 12 monthly WTI futures. Source: Yahoo Finance.",
      aha: "Safe from a crash, but she gives up every dollar of upside.",
    },
    desk: {
      kicker: "04 · Swap",
      title: "Fixed-for-floating swap at {strip}/bbl.",
      body: [
        "Dana receives fixed at the [[strip]], {strip}, and pays floating. Revenue per barrel at settlement price S is h·K + (1 − h)·S.",
        "The [[hedgeRatio]] slider rotates her revenue line between the unhedged diagonal (h = 0) and the flat swap (h = 1).",
      ],
      chartNone: "h = 0%: revenue slope 1.00 per $1 of WTI.",
      chartPartial: "h = {hedged} at K = {strip}: revenue slope {slope} per $1 of WTI.",
      chartFull: "h = 100%: revenue fixed at K = {strip}/bbl.",
      sliderLabel: "Hedge ratio, h",
      unhedged: "Unhedged",
      fullSwap: "Swap, h = 100%, K = {strip}",
      dana: "h = {hedged}",
      xLabel: "WTI at settlement, $/bbl",
      yLabel: "Revenue, $/bbl",
      todayMark: "M1 {today}",
      tableTitle: "Monthly revenue, 10,000 bbl",
      tableScenario: "WTI settles",
      tableUnhedged: "Unhedged",
      tableHedged: "Hedged",
      footnote:
        "As of {date}. K = arithmetic mean of M1–M12 settles (Yahoo Finance, end-of-day). MtM is undiscounted.",
      aha: "Safe from a crash, but she gives up every dollar of upside.",
    },
    desk_stats: {
      notional: "Hedged volume",
      notionalValue: "{barrels} bbl/month",
      mtmInception: "MtM vs. curve at inception",
      mtmSpot: "MtM if all 12 months settle at M1 ({today})",
      mtmMath: "({strip} − {today}) × {barrels} bbl × 12",
    },
  },
} as const;
