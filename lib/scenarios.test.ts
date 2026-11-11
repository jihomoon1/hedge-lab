import { describe, expect, it } from "vitest";
import type { Leg } from "./pricing";
import { monthlyAverages, rescalePath, scenarioPaths, stressTest, wholeDollars } from "./scenarios";

describe("rescalePath", () => {
  it("makes the first price equal today's price and keeps every percent change", () => {
    // 100 → 50 → 75 is −50% then +50%; starting from 80 that is 80 → 40 → 60.
    expect(rescalePath([100, 50, 75], 80)).toEqual([80, 40, 60]);
  });

  it("keeps a price at or below zero as it is, without clipping", () => {
    // 50 → −10 rescaled to start at 100 is 100 → −20.
    expect(rescalePath([50, -10, 0], 100)).toEqual([100, -20, 0]);
  });

  it("returns null when the path cannot be rescaled", () => {
    expect(rescalePath([], 80)).toBeNull();
    expect(rescalePath([0, 10], 80)).toBeNull();
    expect(rescalePath([-5, 10], 80)).toBeNull();
  });
});

describe("monthlyAverages", () => {
  const prices = [
    { date: "2020-03-31", value: 99 }, // before the window
    { date: "2020-04-01", value: 20 },
    { date: "2020-04-20", value: -37 },
    { date: "2020-04-30", value: 19 },
    { date: "2020-05-01", value: 20 },
    { date: "2020-05-29", value: 36 },
    { date: "2020-06-01", value: 99 }, // after the window
  ];

  it("averages the daily prices in each month, negative days included", () => {
    expect(monthlyAverages(prices, "2020-04", "2020-05")).toEqual([
      { month: "2020-04", average: (20 - 37 + 19) / 3 },
      { month: "2020-05", average: 28 },
    ]);
  });
});

describe("scenarioPaths", () => {
  it("builds a 12-month path whose first month equals today's price", () => {
    // Two prices a month from July 2008 to June 2009: 100, 95, 90, ...
    const spot = Array.from({ length: 12 }, (_, i) => {
      const year = i < 6 ? 2008 : 2009;
      const month = String(((i + 6) % 12) + 1).padStart(2, "0");
      const level = 100 - 5 * i;
      return [
        { date: `${year}-${month}-05`, value: level - 1 },
        { date: `${year}-${month}-20`, value: level + 1 },
      ];
    }).flat();
    const [path, ...others] = scenarioPaths(spot, 50);
    expect(others).toHaveLength(0); // the other three scenarios are not in this data
    expect(path.key).toBe("crash2008");
    expect(path.months[0]).toBe("2008-07");
    expect(path.months[11]).toBe("2009-06");
    expect(path.actual[0]).toBe(100);
    expect(path.scaled[0]).toBe(50);
    expect(path.scaled[11]).toBeCloseTo(22.5, 10); // 45 × (50 ÷ 100)
  });
});

describe("stressTest (monthly-average settlement)", () => {
  const prices = [80, 60, 40];

  it("with no legs, hedged revenue equals unhedged revenue", () => {
    // (80 + 60 + 40) × 10,000 = 1,800,000
    expect(stressTest(prices, [], 10_000, 0)).toEqual({ unhedged: 1_800_000, hedged: 1_800_000 });
  });

  it("a full swap turns every month into the fixed price", () => {
    const swap: Leg[] = [{ type: "swap", strike: 70, volume: 10_000 }];
    // 3 months × 70 × 10,000 = 2,100,000
    expect(stressTest(prices, swap, 10_000, 0).hedged).toBe(2_100_000);
  });

  it("a put pays strike minus the monthly average, less its premium", () => {
    const put: Leg[] = [{ type: "longPut", strike: 70, volume: 10_000 }];
    // Payoffs: 0 + (70 − 60) + (70 − 40) = 40 per bbl × 10,000 = 400,000.
    // Hedged = 1,800,000 + 400,000 − 150,000 premium = 2,050,000.
    expect(stressTest(prices, put, 10_000, 150_000).hedged).toBe(2_050_000);
  });

  it("settles on the monthly average, not on each day", () => {
    const put: Leg[] = [{ type: "longPut", strike: 50, volume: 1 }];
    // One month with days at 30 and 70: the average is 50, so a 50 put pays
    // nothing, even though one day was far below the strike.
    const [month] = monthlyAverages(
      [
        { date: "2020-04-01", value: 30 },
        { date: "2020-04-02", value: 70 },
      ],
      "2020-04",
      "2020-04",
    );
    expect(stressTest([month.average], put, 1, 0)).toEqual({ unhedged: 50, hedged: 50 });
  });

  it("lets the payoff math handle a negative price", () => {
    const put: Leg[] = [{ type: "longPut", strike: 70, volume: 10_000 }];
    // Unhedged −20 × 10,000 = −200,000; the put pays (70 − −20) × 10,000 = 900,000.
    expect(stressTest([-20], put, 10_000, 0)).toEqual({ unhedged: -200_000, hedged: 700_000 });
  });
});

describe("wholeDollars (totals that add up on screen)", () => {
  it("rounds each total first, so the difference equals hedged minus unhedged as shown", () => {
    // The 2020 replay on the live site: shown as $7,041,409 and $8,716,443.
    const shown = wholeDollars({ unhedged: 7_041_408.6, hedged: 8_716_443.4 });
    expect(shown.unhedged).toBe(7_041_409);
    expect(shown.hedged).toBe(8_716_443);
    // 8,716,443 − 7,041,409 = 1,675,034 (not 1,675,035, the rounded raw gap of 1,675,034.8)
    expect(shown.diff).toBe(1_675_034);
    expect(shown.diff).toBe(shown.hedged - shown.unhedged);
  });

  it("gives a difference of exactly zero when both totals show the same dollars", () => {
    expect(wholeDollars({ unhedged: 100.4, hedged: 99.6 }).diff).toBe(0);
  });
});
