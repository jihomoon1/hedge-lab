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
  put: {
    plain: "price insurance",
    desk: "long put",
    def: "An option that pays Dana the difference whenever oil settles below a chosen price, in exchange for a fee paid up front.",
  },
  call: {
    plain: "the right to the upside above a ceiling",
    desk: "call",
    def: "An option that pays its owner the difference whenever oil settles above a chosen price. Dana sells one, so she pays out above it.",
  },
  strike: {
    plain: "your floor price",
    desk: "strike (K)",
    def: "The price written into an option: a put pays out below it, a call pays out above it.",
  },
  premium: {
    plain: "what the insurance costs",
    desk: "premium, $/bbl",
    def: "The price of an option, paid up front, per barrel covered.",
  },
  impliedVol: {
    plain: "how jumpy the market expects oil to be",
    desk: "IV (OVX), vol pts",
    def: "Implied volatility: the size of future price swings that today's option prices are betting on, as a yearly percent.",
  },
  vega: {
    plain: "how much the insurance's price moves when fear rises",
    desk: "vega per vol pt",
    def: "The dollar change in an option's price when implied volatility rises by one point.",
  },
  gamma: {
    plain: "how fast the insurance's sensitivity to oil changes",
    desk: "Γ",
    def: "Gamma: the change in an option's delta for a $1 change in the oil price.",
  },
  theta: {
    plain: "what the insurance loses in value each day",
    desk: "Θ per day",
    def: "Theta: the dollar change in an option's price as one day passes, with everything else unchanged.",
  },
  collar: {
    plain: "a floor and a ceiling",
    desk: "costless collar",
    def: "Buying a put (the floor) and selling a call (the ceiling), often with strikes chosen so the two premiums cancel out.",
  },
  threeWay: {
    plain: "a cheaper floor with a trapdoor",
    desk: "3-way",
    def: "A collar plus a second put sold at a lower strike: cheaper, but protection stops below that lower strike.",
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
    perBarrel: "per barrel",
    perBarrelShort: "/bbl",
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
      eyebrow: "WTI [[frontMonth|front month]] · CL=F",
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
      volGapNote: "No vol shown: log returns undefined when price is below zero.",
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
      volGapNote: "No vol shown: log returns undefined when price is below zero.",
      footnote:
        "As of {date}. FRED DCOILWTICO (EIA Cushing spot). RV = √252 · stdev of daily log returns over 21 trading days; any window containing a price at or below zero is left blank.",
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
        "As of {date}. K = arithmetic mean of M1–M12 settles (Yahoo Finance, end-of-day). MtM assumes Dana received fixed at the strip from five sessions earlier; undiscounted.",
      aha: "Safe from a crash, but she gives up every dollar of upside.",
    },
    desk_stats: {
      notional: "Hedged volume",
      notionalValue: "{barrels} bbl/month",
      struck: "Swap struck last week at {stripWeekAgo}",
      mtmLabel: "MtM",
      mtmMath: "({stripWeekAgo} − {strip}) × {barrels} bbl × 12, undiscounted",
    },
  },

  /** Shared by the three option chapters. */
  options: {
    plain: {
      unhedged: "No hedge",
      xLabel: "Oil price when Dana sells ($ per barrel)",
      yLabel: "What Dana receives ($ per barrel)",
      futuresMark: "Futures {F}",
      footnote:
        "As of {date}. Priced with the Black-76 model: {contract} futures at {F}; expected jumpiness (OVX) {ovx} on {ovxDate}; interest rate {rate} on {rateDate}. End-of-day data, not live.",
      monthsOne: "1 month",
      monthsMany: "{months} months",
    },
    desk: {
      unhedged: "Unhedged",
      xLabel: "WTI at settlement, $/bbl",
      yLabel: "Revenue, $/bbl",
      futuresMark: "F {F}",
      footnote:
        "As of {date}. Black-76: F = {contract} settle {F}; σ = OVX {ovx} ({ovxDate}) ÷ 100; r = DTB3 {rate} ({rateDate}); T = {T}y. End-of-day.",
      monthsOne: "1M",
      monthsMany: "{months}M",
    },
  },

  // 5. The put -------------------------------------------------------------
  put: {
    plain: {
      kicker: "Chapter 5 · Buy insurance",
      title: "Dana can pay for a floor and keep the upside.",
      body: [
        "The swap gave away the upside. [[put|Price insurance]] doesn't. Dana picks [[strike|a floor price]] and pays [[premium|a fee]] up front. If oil falls below the floor, the insurance makes up the difference. If oil rises, she keeps the gain.",
        "Move the floor, and how long it has to last. A higher floor or a longer policy costs more. So does fear: the fee rises with [[impliedVol]].",
      ],
      chartTitle: "For {premium} a barrel, Dana's price can't fall below {floor}.",
      strikeLabel: "Floor price",
      monthsLabel: "How long the insurance lasts",
      premiumLabel: "The insurance costs",
      premiumUnit: "per barrel",
      totalLabel: "Total for {volume} barrels a month over {monthsText}",
      withPut: "With insurance",
      strikeMark: "Insurance kicks in at {strike}",
      aha: "Insurance gets expensive exactly when everyone is scared.",
    },
    desk: {
      kicker: "05 · Long put",
      title: "Long put, K = {strike}, {monthsText}.",
      body: [
        "Black-76 on the {contract} contract: F = {F}, σ = {ovx} ([[impliedVol|IV from OVX]]), r = {rate}, T = {T}y. [[premium|Premium]] {basePremium}/bbl.",
        "Dana keeps the upside above K and pays [[theta]] for it. Bump vol 5 points to see her [[vega]] in dollars.",
      ],
      chartTitle: "Long {strike} put: revenue floor at {floor} (K − premium).",
      strikeLabel: "Strike, K",
      monthsLabel: "Expiry",
      premiumLabel: "Premium",
      premiumUnit: "$/bbl",
      totalLabel: "Total premium, {volume} bbl × {monthsText}",
      withPut: "Long put, K = {strike}",
      strikeMark: "K = {strike}, Δ {delta}",
      aha: "Insurance gets expensive exactly when everyone is scared.",
    },
    desk_stats: {
      delta: "Δ",
      gamma: "Γ",
      vega: "Vega per vol pt",
      theta: "Θ per day",
      bumpButton: "Vol +5 pts",
      bumpTitle: "σ {ovx} → {ovxBumped}",
      bumpResult: "Premium {base} → {bumped}: {change} ({changePct})",
      proxyNote:
        "OVX is built from options on the USO oil ETF, not CME options on crude futures. It is a good public proxy, not the vol a desk would quote.",
    },
  },

  // 6. The collar ----------------------------------------------------------
  collar: {
    plain: {
      kicker: "Chapter 6 · The collar",
      title: "Dana can pay for her floor by giving up the top.",
      body: [
        "The insurance costs {putPremium} a barrel. To cover it, Dana can sell someone else [[call]]. Now she has [[collar]]: her price stays between the two.",
        "Slide the ceiling, or press **Make it free** to find the ceiling that pays for the floor exactly.",
      ],
      chartFree: "Dana's price stays between {floor} and {cap}, and the hedge costs her nothing.",
      chartCost: "Dana's price stays between {floor} and {cap}, for {net} a barrel.",
      chartCredit:
        "Dana's price stays between {floor} and {cap}, and she is paid {net} a barrel up front.",
      keptPut: "Floor from chapter 5: {strike} for {monthsText}, costing {putPremium} a barrel.",
      callLabel: "Ceiling price",
      callIncome: "Selling the ceiling pays",
      netCost: "Net cost per barrel",
      netCredit: "Net payment to Dana per barrel",
      button: "Make it free",
      noneTooExpensive:
        "No ceiling can pay for this floor. A floor at {strike} is above the futures price of {F}, so the insurance costs more than any ceiling above {F} would pay. Lower the floor in chapter 5 and try again.",
      noneTooCheap:
        "This floor is so cheap ({putPremium} a barrel) that even a ceiling at {callMax}, three times the futures price, pays more than it costs. Raise the floor in chapter 5 and try again.",
      withCollar: "With the collar",
      floorMark: "Floor {strike}",
      capMark: "Ceiling {call}",
      aha: "No cash out the door; the price is the upside above the cap.",
    },
    desk: {
      kicker: "06 · Collar",
      title: "{name} {strike}/{call}.",
      body: [
        "Long the {strike} put, short the {call} call, both {monthsText}. Net [[premium|premium]] = Put − Call = {putPremium} − {callPremium}.",
        "The solver bisects the call strike between F and 3F until |Put − Call| is under $0.001.",
      ],
      chartFree: "Costless collar {strike}/{call}: revenue between {floor} and {cap}.",
      chartCost: "Collar {strike}/{call}: revenue between {floor} and {cap}, net debit {net}.",
      chartCredit: "Collar {strike}/{call}: revenue between {floor} and {cap}, net credit {net}.",
      keptPut: "Long put from 05: K = {strike}, {monthsText}, premium {putPremium}.",
      callLabel: "Call strike",
      callIncome: "Call premium received",
      netCost: "Net premium (debit)",
      netCredit: "Net premium (credit)",
      button: "Make it free",
      noneTooExpensive:
        "No solution in [F, 3F]: Put({strike}) is worth more than Call(F), because K_put is above F = {F}. Lower the put strike in 05.",
      noneTooCheap:
        "No solution in [F, 3F]: Put({strike}) = {putPremium} is worth less than Call(3F) at {callMax}. Raise the put strike in 05.",
      withCollar: "Collar {strike}/{call}",
      floorMark: "K put {strike}",
      capMark: "K call {call}",
      aha: "No cash out the door; the price is the upside above the cap.",
    },
    desk_stats: {
      structure: "Structure",
      costless: "Costless collar",
      notCostless: "Collar",
      net: "Net premium",
      netDelta: "Net Δ (put − call)",
      debit: "{net} debit",
      credit: "{net} credit",
    },
  },

  // 7. The three-way -------------------------------------------------------
  threeWay: {
    plain: {
      kicker: "Chapter 7 · The three-way",
      title: "A cheaper floor, with a trapdoor under it.",
      body: [
        "Dana can cut the cost again by selling a second, lower piece of insurance to someone else. That gives her [[threeWay]]: her floor now only works down to that lower price.",
        "Below {low}, her floor stops holding and her price falls with the market again. She is never more than {width} a barrel better off than with no hedge. Press **Replay 2020** to see what that means in a crash.",
      ],
      chartTitle: "Below {low}, the trapdoor opens and Dana's price falls with the market again.",
      keptCollar: "Collar from chapter 6: floor {strike}, ceiling {call}, for {monthsText}.",
      lowLabel: "Trapdoor price",
      netCost: "Net cost per barrel",
      netCredit: "Net payment to Dana per barrel",
      zoneLabel: "Trapdoor: protection stops",
      replay: "Replay 2020",
      replaying: "Oil is falling…",
      replayAgain: "Replay 2020 again",
      replayAt: "Dana's monthly revenue with oil at {price}",
      collarLine: "Collar",
      threeWayLine: "Three-way",
      lowMark: "Trapdoor {low}",
      floorMark: "Floor {strike}",
      capMark: "Ceiling {call}",
      oilMark: "Oil {price}",
      aha: "The cheapest hedge can fail exactly when you need it most.",
    },
    desk: {
      kicker: "07 · Three-way",
      title: "3-way {low}/{strike}/{call}.",
      body: [
        "Long the {strike} put, short the {low} put, short the {call} call, all {monthsText}. Net [[premium|premium]] = Put(K_mid) − Put(K_low) − Call(K_high).",
        "Protection is capped at K_mid − K_low = {width}/bbl. Below {low} the structure is fully long the market again.",
      ],
      chartTitle: "3-way {low}/{strike}/{call}: protection capped at {width}/bbl below {low}.",
      keptCollar: "Collar from 06: {strike}/{call}, {monthsText}.",
      lowLabel: "Short put strike, K_low",
      netCost: "Net premium (debit)",
      netCredit: "Net premium (credit)",
      zoneLabel: "No protection below K_low",
      replay: "Replay 2020",
      replaying: "WTI falling…",
      replayAgain: "Replay 2020 again",
      replayAt: "Monthly revenue, WTI at {price}",
      collarLine: "Collar {strike}/{call}",
      threeWayLine: "3-way {low}/{strike}/{call}",
      lowMark: "K low {low}",
      floorMark: "K mid {strike}",
      capMark: "K high {call}",
      oilMark: "WTI {price}",
      aha: "The cheapest hedge can fail exactly when you need it most.",
    },
    desk_stats: {
      net: "Net premium",
      maxProtection: "Max protection per bbl (K_mid − K_low)",
      debit: "{net} debit",
      credit: "{net} credit",
      skewNote:
        "This model uses one flat vol for every strike. Real crude options price put skew, so out-of-the-money puts cost more than shown.",
    },
  },

  // 8. Is insurance cheap right now? ---------------------------------------
  volGauge: {
    plain: {
      kicker: "Chapter 8 · Is insurance cheap right now?",
      title: "Insurance has a price tag, and some days it is a bargain.",
      body: [
        "The fee for price insurance depends on [[impliedVol]]. You can compare that with [[realizedVol]] over the last 30 days.",
        "When the market expects much bigger swings than oil has been having, insurance is pricey. When the gap is small, it is cheap. The dial ranks today's gap against every trading day of the last three years.",
      ],
      // The auto-written sentence: one for each third of the dial.
      sentenceCheap:
        "Insurance is cheaper than usual: the market is charging little extra over the swings oil has actually had.",
      sentenceFair:
        "Insurance is priced about as usual: the market expects swings a normal distance from what oil has actually had.",
      sentenceRich:
        "Insurance is pricier than usual: the market expects bigger swings than oil has actually had.",
      zoneCheap: "Cheap",
      zoneFair: "Fair",
      zoneRich: "Rich",
      dialLabel: "A dial from Cheap to Rich. Today it reads {zone}.",
      expected: "Swings the market expects (a year)",
      actual: "Swings oil has actually had (last 30 days, as a yearly rate)",
      gap: "Gap",
      gapValue: "{spread} points",
      rank: "Days in the last 3 years with a gap this small or smaller",
      footnote:
        "As of {date}. Expected swings: the Cboe OVX index. Actual swings: 30-day moves of the nearest oil futures contract. Ranked against {days} trading days since {from}. End-of-day data, not live.",
      aha: "Traders don't just ask \"what will oil do?\" They ask \"is the market charging too much to insure against it?\"",
    },
    desk: {
      kicker: "08 · IV vs RV",
      title: "IV − RV: {spread} vol pts, {percentile} percentile (3Y).",
      body: [
        "[[impliedVol|IV]] is OVX. [[realizedVol|RV]] is 30-day realized on front-month CL, roll days skipped. The spread is the vol risk premium an option buyer pays.",
        "Percentile = share of daily IV − RV spreads since {from} at or below today's. Bottom third reads cheap, middle third fair, top third rich.",
      ],
      chartTitle: "IV − RV is {spread} vol pts, the {percentile} percentile of the last 3 years: {zone}.",
      zoneCheap: "cheap",
      zoneFair: "fair",
      zoneRich: "rich",
      ivSeries: "IV (OVX)",
      rvSeries: "30-day RV",
      gapSeries: "IV − RV",
      yLabel: "Vol pts, annualized",
      footnote:
        "As of {date}. IV: FRED OVXCLS. RV: √252 · stdev of daily log returns of CL=F over 21 trading days, roll days skipped. {days} trading days since {from}. End-of-day.",
      aha: "Traders don't just ask \"what will oil do?\" They ask \"is the market charging too much to insure against it?\"",
    },
    desk_stats: {
      iv: "IV (OVX)",
      rv: "30-day RV",
      spread: "IV − RV",
      spreadValue: "{spread} vol pts",
      percentile: "Percentile, 3Y",
      percentileValue: "{percentile} ({zone})",
      sample: "Sample",
      sampleValue: "{days} trading days",
    },
  },

  // 9. Your turn: the hedge desk -------------------------------------------
  sandbox: {
    plain: {
      kicker: "Chapter 9 · Your turn: the hedge desk",
      title: "Now build Dana's hedge yourself.",
      body: [
        "Stack up to six pieces, called legs. Each leg covers some of Dana's {volume} barrels a month for the next 12 months. Start from a ready-made hedge, or add legs one at a time and set each one's price and size.",
        "The chart adds every leg together: what Dana takes in for a month, depending on where oil averages that month.",
      ],
      presetsLabel: "Ready-made hedges",
      presetSwap: "Swap 50%",
      presetCollar: "Costless collar",
      presetThreeWay: "Three-way",
      addLeg: "Add leg",
      removeLeg: "Remove leg {n}",
      legLimit: "A hedge can have at most {max} legs.",
      noLegs: "No legs yet. Pick a ready-made hedge or add a leg.",
      collarUnavailable:
        "No ceiling between {F} and {callMax} pays for a {strike} floor today, so the costless collar is not available.",
      typeLabel: "Type",
      strikeLabel: "Price, $ a barrel",
      volumeLabel: "Barrels a month",
      typeSwap: "Lock in a price (swap)",
      typeLongPut: "Buy a floor (put)",
      typeShortPut: "Sell a lower floor (put)",
      typeShortCall: "Sell a ceiling (call)",
      legSwap: "Sell {volume} barrels a month at a fixed {strike}",
      legLongPut: "Floor at {strike} on {volume} barrels a month",
      legShortPut: "The floor stops working below {strike} on {volume} barrels a month",
      legShortCall: "Ceiling at {strike} on {volume} barrels a month",
      legCost: "Costs {amount} up front: 12 monthly options averaging {avg} a barrel.",
      legIncome: "Pays Dana {amount} up front: 12 monthly options averaging {avg} a barrel.",
      legFree: "No up-front cost.",
      netCost: "Up-front cost for all 12 months",
      netCredit: "Up-front payment to Dana for all 12 months",
      chartEmpty: "With no hedge, Dana's monthly revenue rises and falls dollar for dollar with oil.",
      chartTitle:
        "If oil averages {low} in a month, this hedge brings Dana {hedged} instead of {unhedged}.",
      unhedged: "No hedge",
      hedged: "With this hedge",
      xLabel: "Average oil price in the month ($ per barrel)",
      yLabel: "Dana's revenue for the month, after a twelfth of the up-front cost",
      todayMark: "Today {today}",
      footnote:
        "As of {date}. Dana sells {volume} barrels a month. Options priced with the Black-76 model, one for each of the next 12 months, from that month's futures price; expected jumpiness (OVX) {ovx} on {ovxDate}; interest rate {rate} on {rateDate}. End-of-day data, not live.",

      stressKicker: "Chapter 9 · Stress test",
      stressTitle: "Then run it through four real oil years.",
      stressBody: [
        "Each pair of bars replays 12 real months of oil prices, resized so the first month starts at today's price of {today}. Every month is settled at that month's average price, which is how real oil swaps work.",
      ],
      stressChartTitle: "A year of Dana's revenue in four real oil markets, with and without this hedge.",
      stressYLabel: "Revenue over 12 months, including the hedge's up-front cost",
      scenarioCrash2008: "2008 crash",
      scenarioPriceWar2014: "2014 price war",
      scenarioCovid2020: "2020 COVID",
      scenarioSpike2022: "2022 spike",
      scenarioRange: "{from} to {to}",
      pathRange: "Oil averaged between {low} and {high} a month",
      tableTitle: "Revenue over 12 months",
      tableScenario: "Replay",
      tableUnhedged: "No hedge",
      tableHedged: "Hedged",
      tableDiff: "Difference",
      resultBoth:
        "The hedge helped most in the {best} ({bestAmount} more revenue) and cost the most in the {worst} ({worstAmount} less).",
      resultAllHelp:
        "The hedge added revenue in all four: most in the {best} ({bestAmount}), least in the {worst} ({worstAmount}).",
      resultAllHurt:
        "The hedge cost revenue in all four: most in the {worst} ({worstAmount} less), least in the {best} ({bestAmount} less).",
      resultFlat: "This hedge changes nothing in any of the four.",
      resultNone: "Add a leg to see how a hedge changes these four years.",
      stressFootnote:
        "Monthly averages of the U.S. crude spot price (FRED DCOILWTICO, through {spotDate}). Each path is rescaled by percent change so its first month equals today's front-month price, {today} on {date}.",
      shareIntro: "This hedge is saved in the page address, so a link reopens it exactly.",
      copyLink: "Copy link",
      copied: "Copied",
      copyFailed: "Copying is blocked in this browser. Copy the link from here:",
      aha: "You are now doing what a commodities derivatives desk does for its clients.",
    },
    desk: {
      kicker: "09 · Hedge desk",
      title: "Structure a 12-month hedge on {volume} bbl/month.",
      body: [
        "Up to six legs: receive-fixed swap, long put, short put, short call. Each leg is a 12-month strip, one contract per month, priced off that month's futures with flat vol.",
        "Payoff is per settlement month: physical revenue plus leg payoffs, less net [[premium|premium]] ÷ 12.",
      ],
      presetsLabel: "Presets",
      presetSwap: "Swap 50%",
      presetCollar: "Costless collar",
      presetThreeWay: "Three-way",
      addLeg: "Add leg",
      removeLeg: "Remove leg {n}",
      legLimit: "Max {max} legs.",
      noLegs: "No legs. Pick a preset or add a leg.",
      collarUnavailable:
        "No call strike between {F} and {callMax} finances the {strike} put, so no costless collar today.",
      typeLabel: "Type",
      strikeLabel: "Strike, $/bbl",
      volumeLabel: "Volume, bbl/month",
      typeSwap: "Swap (receive fixed)",
      typeLongPut: "Long put",
      typeShortPut: "Short put",
      typeShortCall: "Short call",
      legSwap: "Swap {strike} x {volume}",
      legLongPut: "Long {strike} put x {volume}",
      legShortPut: "Short {strike} put x {volume}",
      legShortCall: "Short {strike} call x {volume}",
      legCost: "Premium paid {amount}: 12 monthly puts, avg {avg}/bbl.",
      legIncome: "Premium received {amount}: 12 monthly options, avg {avg}/bbl.",
      legFree: "No premium.",
      netCost: "Net premium, 12M (debit)",
      netCredit: "Net premium, 12M (credit)",
      chartEmpty: "Unhedged: monthly revenue is {volume} bbl × settlement.",
      chartTitle: "At a {low} monthly settle, hedged revenue is {hedged} vs {unhedged} unhedged.",
      unhedged: "Unhedged",
      hedged: "Hedged",
      xLabel: "Monthly average settlement, $/bbl",
      yLabel: "Revenue per month, $, net of premium ÷ 12",
      todayMark: "M1 {today}",
      footnote:
        "As of {date}. {volume} bbl/month. Black-76 per contract month, F = that month's settle, T = 1/12 to 12/12; σ = OVX {ovx} ({ovxDate}) ÷ 100; r = DTB3 {rate} ({rateDate}). End-of-day.",

      stressKicker: "09 · Stress test",
      stressTitle: "Stress the structure on four historical 12M paths.",
      stressBody: [
        "Monthly averages of WTI spot for each window, rescaled by percent change so month 0 equals today's M1, {today}. Each month settles against its own average.",
      ],
      stressChartTitle: "12M revenue, unhedged vs hedged, on four rescaled historical paths.",
      stressYLabel: "12M revenue, $, net of premium",
      scenarioCrash2008: "2008 crash",
      scenarioPriceWar2014: "2014 OPEC war",
      scenarioCovid2020: "2020 COVID",
      scenarioSpike2022: "2022 spike",
      scenarioRange: "{from} to {to}",
      pathRange: "Rescaled monthly avg {low} to {high}",
      tableTitle: "12M revenue, net of premium",
      tableScenario: "Path",
      tableUnhedged: "Unhedged",
      tableHedged: "Hedged",
      tableDiff: "Hedge P&L",
      resultBoth:
        "The hedge helped most in the {best} ({bestAmount} more revenue) and cost the most in the {worst} ({worstAmount} less).",
      resultAllHelp:
        "The hedge added revenue in all four: most in the {best} ({bestAmount}), least in the {worst} ({worstAmount}).",
      resultAllHurt:
        "The hedge cost revenue in all four: most in the {worst} ({worstAmount} less), least in the {best} ({bestAmount} less).",
      resultFlat: "This hedge changes nothing in any of the four.",
      resultNone: "Add a leg to see how a hedge changes these four years.",
      stressFootnote:
        "FRED DCOILWTICO monthly averages through {spotDate}, rescaled so month 0 = M1 settle {today} ({date}).",
      shareIntro: "The structure is encoded in the URL query string.",
      copyLink: "Copy link",
      copied: "Copied",
      copyFailed: "Clipboard blocked. Copy the link from here:",
      aha: "You are now doing what a commodities derivatives desk does for its clients.",
    },
    desk_stats: {
      delta: "Total Δ, bbl",
      gamma: "Total Γ, bbl per $1",
      vega: "Total vega, $ per vol pt",
      theta: "Total Θ, $ per day",
      greeksNote:
        "Hedge legs only, summed over all legs and all 12 months and scaled by volume. Dana's physical barrels add +{physical} bbl of Δ.",
      asianNote:
        "Monthly-average settlement makes these options closer to Asian options; Black-76 here is an approximation.",
    },
  },

  // Browser tab, search results and link previews ---------------------------
  meta: {
    name: "Hedge Lab",
    title: "Hedge Lab: how oil producers hedge, explained live",
    description:
      "Follow one oil producer through swaps, puts, collars and three-ways, priced off daily market data, in plain English or desk speak.",
    tagline: "How oil producers hedge, explained live",
    priceLabel: "U.S. crude oil (WTI), latest close",
    priceUnit: "per barrel",
    asOf: "As of {date}",
    imageAlt: "Hedge Lab: how oil producers hedge, explained live, with the latest WTI price",
  },

  // Footer -----------------------------------------------------------------
  footer: {
    glossaryTitle: "Glossary",
    glossaryIntro: "Every underlined term on this site, in both vocabularies.",
    plainHeading: "Plain English",
    deskHeading: "Desk Speak",
    sourcesTitle: "Data and sources",
    asOf: "Futures prices as of {date}. All data is end-of-day and refreshes once each weekday evening. It is not live.",
    noData: "Market data has not loaded yet.",
    latest: "latest {date}",
    sources: [
      {
        name: "Yahoo Finance",
        detail: "WTI futures prices for the front month (CL=F) and the next 12 contract months",
        url: "https://finance.yahoo.com/quote/CL%3DF/",
        date: "futures",
      },
      {
        name: "FRED DCOILWTICO",
        detail: "WTI spot price at Cushing, daily (price history and stress-test paths)",
        url: "https://fred.stlouisfed.org/series/DCOILWTICO",
        date: "spot",
      },
      {
        name: "FRED OVXCLS",
        detail: "Cboe crude oil volatility index, OVX (option pricing and the vol gauge)",
        url: "https://fred.stlouisfed.org/series/OVXCLS",
        date: "ovx",
      },
      {
        name: "FRED DTB3",
        detail: "3-month Treasury bill rate (the interest rate in option pricing)",
        url: "https://fred.stlouisfed.org/series/DTB3",
        date: "tbill",
      },
    ],
    builtBy: "Built by Jiho Moon",
    linkedin: "LinkedIn",
    linkedinUrl: "https://www.linkedin.com/in/jihomoonn",
    github: "GitHub",
    githubUrl: "https://github.com/jihomoon1/hedge-lab",
    disclaimer: "Educational project, not investment advice.",
  },
} as const;
