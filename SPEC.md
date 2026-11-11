# Hedge Lab — Build Spec

Nov 11, 2026 · Jiho Moon

## Concept

Hedge Lab is a scroll-through website that teaches commodity derivatives by following one fictional oil producer through her hedging decisions, priced off real market data. Every screen works on two levels: a novice reads a story and drags sliders; a trader flips a switch to **Desk Speak** and sees strikes, Greeks and vol points on the same chart.

The thesis of the site, in one line: **same chart, two vocabularies.** That is the expert–novice intersection. Nothing is dumbed down, and nothing is hidden behind jargon.

**The character.** Dana runs a small oil producer in West Texas and pumps 10,000 barrels a month. Her cost to produce is an editable assumption (default $55/bbl, labeled "illustrative"). Each chapter is one decision Dana faces, so the reader learns each instrument as the answer to a real problem.

**Is it dynamic? Yes, in two ways.**

- **Daily data.** Prices, the futures curve and implied vol refresh once a day from free feeds (FRED and Yahoo Finance). Every chart shows an "as of" date. It is end-of-day, not tick-by-tick; the site says so plainly, which a trader will respect.
- **Instant math.** All option pricing runs in the browser, so dragging a strike, expiry or vol slider redraws the premium and payoff chart instantly. No loading spinners.

## The Plain English ↔ Desk Speak toggle

One switch, pinned top-right, changes the whole site's vocabulary and look. Default is Plain English. The choice is remembered per browser.

What flips when you switch:

- **Labels and copy.** Every chapter has two short text versions, written separately (not auto-translated).
- **Numbers shown.** Plain shows dollars per barrel and total dollars for Dana. Desk adds the Greeks panel, vol in points, spreads and percentiles.
- **The room itself.** Plain is a warm, editorial "paper" theme. Desk flips to a dark terminal theme with monospace numbers. The reader literally walks onto the trading floor.
- **Chart annotations.** Plain annotations explain ("insurance kicks in here"); Desk annotations quantify ("K = $60, Δ −0.44").

In both modes, any underlined term shows a one-line definition on hover or tap.

| Element | Plain English | Desk Speak |
| --- | --- | --- |
| Swap | Lock in a price | Fixed-for-floating swap at $X/bbl |
| Put | Price insurance | Long put, K = $60 |
| Strike | Your floor price | Strike |
| Premium | What the insurance costs | Premium, $/bbl |
| Collar | A floor and a ceiling | Costless collar 60/75 |
| Three-way | A cheaper floor with a trapdoor | 3-way 50/60/75 |
| Contango | Future barrels cost more than today's | Contango, M1–M12 spread +$X |
| Backwardation | Today's barrels cost more than future ones | Backwardation, M1–M12 spread −$X |
| Implied vol | How jumpy the market expects oil to be | IV (OVX), vol pts |
| Realized vol | How jumpy oil has actually been | 30-day RV, annualized |
| Delta | How much the insurance's value moves when oil moves $1 | Δ |
| Vega | How much the insurance's price moves when fear rises | Vega per vol pt |

## Chapters

Ten chapters on one long scrolling page. On desktop the chart stays pinned on the right while the text scrolls on the left; on mobile they stack. Each chapter ends on one "aha" line in bold.

### 0. Hero

- **Sees:** yesterday's WTI settle as a big number that counts up on load, a one-year sparkline, and one question: "If you had to sell your oil at this price, could you sleep tonight?"
- **Data:** WTI front month from Yahoo (`CL=F`).
- **Desk adds:** day change in $ and %, 30-day realized vol.

### 1. Meet Dana

- **Widget:** an oil price slider from $20 to $130. Dana's monthly revenue (10,000 × price) and profit (vs. her $55 cost) update live. Below breakeven, the profit bar turns red.
- **Plain:** "Every $10 move in oil is $100,000 a month to Dana."
- **Desk:** her exposure as a delta: long 10,000 bbl/month, $10k P&L per $1.
- **Aha:** Dana is not in the oil business; she is in the oil *price* business.

### 2. Oil's mood swings

- **Widget:** WTI daily price since 2007 with a Play button that animates the line forward. Five pinned callouts: the 2008 spike and crash, the 2014–16 OPEC price war, April 2020 when front-month WTI went below zero, the 2022 spike after Russia invaded Ukraine, and the 2026 vol spike during the U.S.-Israeli strikes on Iran.
- **Data:** FRED `DCOILWTICO`.
- **Desk adds:** a second axis with 30-day realized vol, so the reader sees vol cluster in crises.
- **Aha:** price risk is not hypothetical: oil has halved within a year more than once.

### 3. The futures curve

- **Widget:** the next 12 monthly crude futures plotted as a curve, plus last week's curve as a faded ghost line. A small animated storage tank fills in contango (paid to store oil) and drains in backwardation (paid to sell now).
- **Data:** Yahoo contract tickers (see Data sources).
- **Plain:** "Today the market pays more for oil delivered now than oil delivered later" (or the reverse, auto-written from the data).
- **Desk:** M1–M12 spread in $, annualized roll yield.
- **Aha:** a futures price is not a forecast; it is a price you can lock in today.

### 4. Lock it in: the swap

- **Widget:** a chart of Dana's revenue vs. the oil price at settlement. Unhedged is a diagonal line; a swap is a flat line. A hedge-ratio slider (0–100%) rotates the line between the two.
- **Pricing:** swap price = average of the next 12 contract months (the "12-month strip").
- **Desk adds:** mark-to-market of the swap at today's price.
- **Aha:** safe from a crash, but she gives up every dollar of upside.

### 5. Buy insurance: the put

- **Widget:** strike and months-to-expiry sliders. Black-76 prices the put live and shows the premium per barrel and the total cost for Dana's volume. The payoff chart draws a floor, minus the premium.
- **Inputs:** F = the futures month matching the chosen expiry, vol = OVX / 100, r = 3-month T-bill.
- **Desk adds:** a Greeks panel (Δ, Γ, vega, Θ) and a "vol +5 pts" button that shows how much the premium jumps.
- **Aha:** insurance gets expensive exactly when everyone is scared.

### 6. The collar

- **Widget:** add a ceiling by selling a call. A **Make it free** button runs a solver that slides the call strike until the net premium is $0, and animates the ceiling into place.
- **Desk:** "Costless collar 60/X" with net premium and net delta.
- **Aha:** no cash out the door; the price is the upside above the cap.

### 7. The three-way

- **Widget:** add a lower put sold below the floor. The payoff chart shows the "trapdoor": below the lower strike, protection stops. A **Replay 2020** button drops oil to $20 and compares Dana's revenue under unhedged, collar and three-way.
- **Desk:** net premium, max protection per bbl (mid strike minus low strike), and a note that the model uses flat vol while real markets price put skew.
- **Aha:** the cheapest hedge can fail exactly when you need it most.

### 8. Is insurance cheap right now?

- **Widget:** a dial reading Cheap / Fair / Rich, based on implied vol (OVX) minus 30-day realized vol, ranked against the last three years.
- **Desk:** IV − RV in vol points and its percentile, plus a line chart of both series.
- **Aha:** traders don't just ask "what will oil do?" They ask "is the market charging too much to insure against it?"

### 9. Your turn: the hedge desk

- **Widget:** a sandbox. Stack legs (swap, long put, short put, short call), each with a strike and a volume. See the combined payoff, net premium and, in Desk mode, total Greeks.
- **Stress test:** run the structure through four real 12-month price paths (2008, 2014, 2020, 2022) and show unhedged vs. hedged revenue as bars.
- **Share:** the structure is encoded in the URL, so a link reopens the exact hedge.
- **Aha:** the reader is now doing what a commodities derivatives desk does for clients.

### Footer

Glossary, data as-of date and sources, "Built by Jiho Moon" with LinkedIn and GitHub links, and a one-line "educational, not investment advice" note.

## Data sources

Four free feeds cover everything. One catch: EIA stopped publishing NYMEX futures prices after April 5, 2024 (https://www.eia.gov/dnav/pet/pet_pri_fut_s1_d.htm), so the futures curve comes from Yahoo Finance contract tickers instead.

| Data | Source | Series / ticker | Updates | Used in |
| --- | --- | --- | --- | --- |
| WTI futures curve, next 12 months | Yahoo Finance via the `yahoo-finance2` npm package | `CL=F` (front month) plus contract tickers like `CLZ26.NYM`, `CLF27.NYM` | Daily close | Hero, curve, swap strip, option pricing, realized vol |
| WTI price history since 1986 | FRED (https://fred.stlouisfed.org/series/DCOILWTICO) | `DCOILWTICO` (EIA Cushing spot) | Can lag about a week | History replay, stress-test scenarios |
| Crude implied vol | FRED (https://fred.stlouisfed.org/series/OVXCLS) | `OVXCLS` (Cboe OVX), history from May 2007 | Daily close | Option pricing, vol gauge |
| Risk-free rate | FRED | `DTB3` (3-month T-bill) | Daily | Discount rate r in Black-76 |

**Contract ticker format:** `CL` + month code + two-digit year + `.NYM`. Month codes: F Jan, G Feb, H Mar, J Apr, K May, M Jun, N Jul, Q Aug, U Sep, V Oct, X Nov, Z Dec.

**How data gets in:** a Vercel Cron job runs once each weekday evening. It calls the feeds, cleans the numbers and saves one `market.json` file. The site reads only that file, so a feed outage never breaks the page; it just shows the last good as-of date.

**Keys:** a free FRED API key, stored as the env var `FRED_API_KEY` (in `.env.local` locally, in Vercel project settings in production). Never commit the key to GitHub. Yahoo needs no key, but it is unofficial, so the cron must fail gracefully and keep yesterday's file.

**Desk-mode honesty note (put this on the site):** OVX is built from options on the USO oil ETF, not CME options on crude futures. It is a good public proxy, not the vol a desk would quote.

## The math

All of it lives in one file, `lib/pricing.ts`, runs in the browser, and has unit tests. Notation: F = futures price, K = strike, σ = implied vol as a decimal (OVX 40 → 0.40), T = years to expiry, r = T-bill rate as a decimal, N = standard normal CDF, φ = standard normal PDF.

**Black-76** (the standard model for options on futures):

```
d1 = (ln(F/K) + σ²·T/2) / (σ·√T)
d2 = d1 − σ·√T
Call = e^(−rT) · [F·N(d1) − K·N(d2)]
Put  = e^(−rT) · [K·N(−d2) − F·N(−d1)]
```

**Greeks:**

```
Delta_call = e^(−rT) · N(d1)
Delta_put  = −e^(−rT) · N(−d1)
Gamma      = e^(−rT) · φ(d1) / (F·σ·√T)
Vega       = e^(−rT) · F · φ(d1) · √T
Theta_call = −e^(−rT)·F·φ(d1)·σ / (2√T) + r·Call
Theta_put  = −e^(−rT)·F·φ(d1)·σ / (2√T) + r·Put
```

Show vega per 1 vol point (divide by 100) and theta per day (divide by 365).

**Unit test values:** F = 60, K = 60, σ = 0.40, T = 0.5, r = 0.04 gives call = put = 6.6142, put delta = −0.4350, vega = 0.1643 per vol point. Same inputs with K = 55 gives put = 4.1835. If the code doesn't match to 4 decimals, it's wrong.

**Realized vol** (30-day, annualized), from daily closes of the front month:

```
RV = √252 · stdev( ln(F_t / F_(t−1)) ) over the last 21 trading days
```

Roll trap: when the front month rolls to the next contract, the price jumps for a reason that isn't a real move. Skip returns on roll days.

**Swap at hedge ratio h** (per barrel, S = price at settlement):

```
Revenue = h·K_swap + (1 − h)·S
```

**Zero-cost collar solver:** given the put strike, find the call strike where Call(K_call) = Put(K_put). Call value falls as strike rises, so use bisection between F and 3F, stopping when the gap is under $0.001.

**Three-way** (long put at K_mid, short put at K_low, short call at K_high):

```
Revenue     = S + max(K_mid − S, 0) − max(K_low − S, 0) − max(S − K_high, 0) − net_premium
net_premium = Put(K_mid) − Put(K_low) − Call(K_high)
```

**Stated limitation (show in Desk mode):** one flat vol for every strike. Real crude options price put skew, so out-of-the-money puts cost more than this model says.

## Design and visual direction

Plain mode should feel like an interactive news explainer (think the New York Times' interactive graphics); Desk mode should feel like a trading terminal. The mode switch is the signature moment of the site.

| | Plain English mode | Desk Speak mode |
| --- | --- | --- |
| Background | Warm off-white paper | Near-black |
| Accent | Crude amber for Dana's revenue, teal for the hedge | Terminal amber and green, red for losses |
| Headings | Serif (Fraunces) | Same serif, smaller |
| Numbers | Sans (Inter) | Monospace (JetBrains Mono), right-aligned |
| Charts | Thick lines, big plain-language annotations | Thin lines, gridlines, exact values on hover |

**Motion (subtle, not flashy):**

- Charts draw in as their chapter scrolls into view.
- The mode switch cross-fades colors over about 300 ms instead of snapping.
- Payoff lines animate smoothly when a slider moves.
- The storage tank and the Replay 2020 crash are the only "set piece" animations.

**Layout:**

- Desktop: text column on the left (about 40%), sticky chart on the right (60%).
- Mobile: chart on top, text below, sliders full width with big thumb targets.

**Rules:**

- Every chart answers one question, written as its title ("Dana's floor holds until $50"), not a label ("Payoff diagram").
- Color is never the only signal: hedged vs. unhedged lines also differ in dash style and carry labels.
- No stock photos and no oil-rig clip art. The data is the visual.

## Tech stack and file structure

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | One project for pages and the data job |
| Styling | Tailwind CSS | Two themes are just two sets of color variables |
| Charts | Recharts | Simple to learn; switch to D3 only if a chart can't be done |
| Animation | Framer Motion | Scroll-in and slider animations |
| Data job | Vercel Cron + a Next.js route | Runs daily, writes market.json |
| Storage | Vercel Blob (one JSON file) | No database needed |
| Tests | Vitest | Checks the pricing math |
| Repo | GitHub, jihomoon1/hedge-lab | Link it from the site footer and resume |

```
hedge-lab/
  SPEC.md                  this file
  CLAUDE.md                short rules for Claude Code
  app/
    page.tsx               the one long page, chapters in order
    api/refresh/route.ts   cron job: fetch feeds, write market.json
  components/
    ModeToggle.tsx
    Term.tsx               underlined term with hover definition
    chapters/              Hero.tsx, MeetDana.tsx, History.tsx, Curve.tsx,
                           Swap.tsx, Put.tsx, Collar.tsx, ThreeWay.tsx,
                           VolGauge.tsx, Sandbox.tsx
    charts/                PayoffChart.tsx, CurveChart.tsx, PriceHistory.tsx
  lib/
    pricing.ts             Black-76, Greeks, collar solver, payoffs
    pricing.test.ts        the unit test values from The math
    market.ts              loads market.json, types for the data
    copy.ts                every Plain and Desk text string, by chapter
    scenarios.ts           2008, 2014, 2020, 2022 price paths
  vercel.json              cron schedule
```

Keep all the words in `lib/copy.ts` so the owner can rewrite the Plain and Desk text without touching the code.

## Build phases

1. **Skeleton and data:** project setup, the data job, market.json, and the Hero chapter.
2. **Pricing engine:** lib/pricing.ts plus passing unit tests. No UI.
3. **Story chapters 1–4:** sticky-chart layout, copy.ts, ModeToggle, Term, both themes, mobile.
4. **Options chapters 5–7:** put, collar, three-way, Greeks panel, solver and Replay 2020 animations.
5. **Vol gauge and sandbox:** chapters 8 and 9, scenarios, shareable URL.
6. **Polish and ship:** review against this spec, 375px test, footer, Open Graph tags, no console errors, deploy.

The owner is a beginner programmer: explain each new file in one sentence, and stop after each phase so it can be checked in the browser.
