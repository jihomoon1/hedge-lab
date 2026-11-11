import { describe, expect, it } from "vitest";
import {
  black76Call,
  black76Greeks,
  black76Put,
  curveSpread,
  monthlyProfit,
  monthlyRevenue,
  normCdf,
  realizedVol,
  rollYield,
  stripPrice,
  swapMarkToMarket,
  swapRevenue,
  threeWayNetPremium,
  threeWayRevenue,
  zeroCostCallStrike,
} from "./pricing";

// The reference inputs from SPEC.md "Unit test values".
const F = 60;
const sigma = 0.4;
const T = 0.5;
const r = 0.04;

describe("normCdf", () => {
  it("matches known values of the normal distribution", () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 6);
    expect(normCdf(1.96)).toBeCloseTo(0.975, 4);
    expect(normCdf(-1.96)).toBeCloseTo(0.025, 4);
  });
});

describe("Black-76 prices (SPEC unit test values)", () => {
  it("prices the at-the-money call and put at 6.6142", () => {
    expect(black76Call(F, 60, sigma, T, r)).toBeCloseTo(6.6142, 4);
    expect(black76Put(F, 60, sigma, T, r)).toBeCloseTo(6.6142, 4);
  });

  it("prices the K = 55 put at 4.1835", () => {
    expect(black76Put(F, 55, sigma, T, r)).toBeCloseTo(4.1835, 4);
  });

  it("satisfies put-call parity: Call − Put = e^(−rT)·(F − K)", () => {
    for (const K of [40, 55, 60, 75, 100]) {
      const lhs = black76Call(F, K, sigma, T, r) - black76Put(F, K, sigma, T, r);
      expect(lhs).toBeCloseTo(Math.exp(-r * T) * (F - K), 5);
    }
  });

  it("is worth only its discounted payoff when no time is left", () => {
    expect(black76Call(70, 60, sigma, 0, r)).toBe(10);
    expect(black76Put(70, 60, sigma, 0, r)).toBe(0);
    expect(black76Put(50, 60, sigma, 0, r)).toBe(10);
  });
});

describe("Black-76 Greeks", () => {
  const put = black76Greeks("put", F, 60, sigma, T, r);
  const call = black76Greeks("call", F, 60, sigma, T, r);

  it("matches the SPEC values: put delta −0.4350, vega 0.1643 per vol point", () => {
    expect(put.delta).toBeCloseTo(-0.435, 4);
    expect(put.vega).toBeCloseTo(0.1643, 4);
    expect(call.vega).toBeCloseTo(0.1643, 4);
  });

  it("has call delta − put delta = e^(−rT)", () => {
    expect(call.delta - put.delta).toBeCloseTo(Math.exp(-r * T), 6);
  });

  // Independent check: nudge one input a tiny bit and see how the price moves.
  it("has delta and gamma that match small bumps in F", () => {
    const h = 0.01;
    const up = black76Put(F + h, 60, sigma, T, r);
    const mid = black76Put(F, 60, sigma, T, r);
    const down = black76Put(F - h, 60, sigma, T, r);
    expect(put.delta).toBeCloseTo((up - down) / (2 * h), 4);
    expect(put.gamma).toBeCloseTo((up - 2 * mid + down) / (h * h), 3);
  });

  it("has vega that matches a one-vol-point bump", () => {
    const bumped =
      (black76Put(F, 60, sigma + 0.005, T, r) - black76Put(F, 60, sigma - 0.005, T, r));
    expect(put.vega).toBeCloseTo(bumped, 4);
  });

  it("has theta per day that matches one day passing", () => {
    const day = 1 / 365;
    for (const [type, price] of [
      ["call", black76Call],
      ["put", black76Put],
    ] as const) {
      const perDay = (price(F, 55, sigma, T - day, r) - price(F, 55, sigma, T + day, r)) / 2;
      expect(black76Greeks(type, F, 55, sigma, T, r).theta).toBeCloseTo(perDay, 4);
    }
  });
});

describe("swapRevenue", () => {
  it("is the oil price when unhedged and the swap price when fully hedged", () => {
    expect(swapRevenue(0, 70, 40)).toBe(40);
    expect(swapRevenue(1, 70, 40)).toBe(70);
  });

  it("blends the two at a partial hedge ratio", () => {
    // 0.6 × 70 + 0.4 × 40 = 42 + 16 = 58
    expect(swapRevenue(0.6, 70, 40)).toBeCloseTo(58, 10);
  });
});

describe("zeroCostCallStrike", () => {
  it("finds a call strike whose premium is within $0.001 of the put's", () => {
    for (const putStrike of [45, 50, 55, 60]) {
      const callStrike = zeroCostCallStrike(F, putStrike, sigma, T, r)!;
      expect(callStrike).not.toBeNull();
      const net =
        black76Put(F, putStrike, sigma, T, r) - black76Call(F, callStrike, sigma, T, r);
      expect(Math.abs(net)).toBeLessThan(0.001);
      expect(callStrike).toBeGreaterThanOrEqual(F);
      expect(callStrike).toBeLessThanOrEqual(3 * F);
    }
  });

  it("puts the ceiling at F when the floor is at F (call = put there)", () => {
    expect(zeroCostCallStrike(F, 60, sigma, T, r)!).toBeCloseTo(60, 1);
  });

  it("pushes the ceiling higher as the floor drops", () => {
    const near = zeroCostCallStrike(F, 55, sigma, T, r)!;
    const far = zeroCostCallStrike(F, 45, sigma, T, r)!;
    expect(far).toBeGreaterThan(near);
  });

  it("returns null when no strike between F and 3F can pay for the put", () => {
    expect(zeroCostCallStrike(F, 70, sigma, T, r)).toBeNull();
  });
});

describe("three-way", () => {
  const strikes = { low: 50, mid: 60, high: 75 };

  it("net premium is Put(mid) − Put(low) − Call(high)", () => {
    const expected =
      black76Put(F, 60, sigma, T, r) -
      black76Put(F, 50, sigma, T, r) -
      black76Call(F, 75, sigma, T, r);
    expect(threeWayNetPremium(F, strikes, sigma, T, r)).toBeCloseTo(expected, 10);
  });

  const premium = 1.5;

  it("below the low strike: protection is capped at mid − low (the trapdoor)", () => {
    // 40 + (60 − 40) − (50 − 40) − 0 − 1.5 = 40 + 20 − 10 − 1.5 = 48.5
    expect(threeWayRevenue(40, strikes, premium)).toBeCloseTo(48.5, 10);
    // 20 + 40 − 30 − 1.5 = 28.5: still only $10 better than unhedged
    expect(threeWayRevenue(20, strikes, premium)).toBeCloseTo(28.5, 10);
  });

  it("between the low and mid strikes: the floor holds", () => {
    // 55 + (60 − 55) − 0 − 0 − 1.5 = 58.5
    expect(threeWayRevenue(55, strikes, premium)).toBeCloseTo(58.5, 10);
  });

  it("between the mid and high strikes: Dana just gets the market price", () => {
    // 70 + 0 − 0 − 0 − 1.5 = 68.5
    expect(threeWayRevenue(70, strikes, premium)).toBeCloseTo(68.5, 10);
  });

  it("above the high strike: revenue is capped at the ceiling", () => {
    // 90 + 0 − 0 − (90 − 75) − 1.5 = 73.5
    expect(threeWayRevenue(90, strikes, premium)).toBeCloseTo(73.5, 10);
  });
});

describe("realizedVol", () => {
  it("annualizes the sample standard deviation of log returns", () => {
    // Two returns a and b: sample stdev = |a − b| / √2.
    const a = Math.log(110 / 100);
    const b = Math.log(99 / 110);
    const expected = (Math.sqrt(252) * Math.abs(a - b)) / Math.sqrt(2);
    const rv = realizedVol([{ close: 100 }, { close: 110 }, { close: 99 }], 2);
    expect(rv).toBeCloseTo(expected, 10);
  });

  it("is zero when the price grows at a perfectly steady rate", () => {
    const points = Array.from({ length: 22 }, (_, i) => ({ close: 50 * 1.01 ** i }));
    expect(realizedVol(points)).toBeCloseTo(0, 10);
  });

  it("skips the return on a roll day", () => {
    const steady = Array.from({ length: 22 }, (_, i) => ({ close: 50 * 1.01 ** i }));
    // A fake $10 jump on a roll day, then the same steady growth afterwards.
    const withRoll = steady.map((p, i) =>
      i >= 10 ? { close: p.close + 10 * 1.01 ** (i - 10), roll: i === 10 } : p,
    );
    expect(realizedVol(withRoll)).toBeCloseTo(0, 10);
    // Without the roll flag the same jump shows up as (fake) volatility.
    const unflagged = withRoll.map((p) => ({ close: p.close }));
    expect(realizedVol(unflagged)!).toBeGreaterThan(0.1);
  });

  it("only looks at the last `window` returns", () => {
    const calm = Array.from({ length: 22 }, (_, i) => ({ close: 50 * 1.01 ** i }));
    expect(realizedVol([{ close: 5 }, { close: 500 }, ...calm])).toBeCloseTo(0, 10);
  });

  it("returns null without enough data", () => {
    expect(realizedVol([{ close: 60 }, { close: 61 }])).toBeNull();
  });
});

describe("Dana's business", () => {
  it("revenue is barrels × price", () => {
    // 10,000 × 86 = 860,000
    expect(monthlyRevenue(86, 10_000)).toBe(860_000);
  });

  it("profit is barrels × (price − cost), negative below breakeven", () => {
    // 10,000 × (86 − 55) = 310,000 and 10,000 × (40 − 55) = −150,000
    expect(monthlyProfit(86, 55, 10_000)).toBe(310_000);
    expect(monthlyProfit(40, 55, 10_000)).toBe(-150_000);
    expect(monthlyProfit(55, 55, 10_000)).toBe(0);
  });
});

describe("futures curve", () => {
  const backwardated = [86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64];
  const contango = [...backwardated].reverse();

  it("strip price is the plain average of the months", () => {
    // (86 + 64) ÷ 2 = 75 for an evenly spaced curve
    expect(stripPrice(backwardated)).toBeCloseTo(75, 10);
  });

  it("spread is last month − first month: negative in backwardation", () => {
    expect(curveSpread(backwardated)).toBe(-22);
    expect(curveSpread(contango)).toBe(22);
  });

  it("roll yield is (M1 ÷ M12 − 1) × 12/11", () => {
    expect(rollYield(backwardated)).toBeCloseTo((86 / 64 - 1) * (12 / 11), 10);
    expect(rollYield(contango)).toBeLessThan(0);
  });

  it("swap mark-to-market is (K − price) × barrels for the fixed receiver", () => {
    // (75 − 80) × 5,000 = −25,000: Dana locked in below the market
    expect(swapMarkToMarket(75, 80, 5_000)).toBe(-25_000);
    expect(swapMarkToMarket(75, 60, 5_000)).toBe(75_000);
    expect(swapMarkToMarket(75, 75, 5_000)).toBe(0);
  });
});
