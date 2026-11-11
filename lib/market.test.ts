import { describe, expect, it } from "vitest";
import { heroData, historyData, type FrontPoint, type MarketData, type Observation } from "./market";

/** A market.json with only the parts a test needs filled in. */
function market(parts: Partial<MarketData>): MarketData {
  return {
    asOf: "2026-11-10",
    generatedAt: "2026-11-11T05:39:44.580Z",
    front: [],
    curve: [],
    wtiSpot: [],
    ovx: [],
    tbill3m: { date: "2026-11-09", value: 4.06 },
    ...parts,
  };
}

describe("heroData day change", () => {
  it("is the latest close minus the previous trading day's close, in $ and %", () => {
    // The real closes behind the live site on November 10, 2026.
    const front: FrontPoint[] = [
      { date: "2026-11-05", close: 90.52 },
      { date: "2026-11-06", close: 90.83 },
      { date: "2026-11-09", close: 86.85 },
      { date: "2026-11-10", close: 86.04 },
    ];
    const hero = heroData(market({ front }))!;
    expect(hero.asOf).toBe("2026-11-10");
    expect(hero.settle).toBe(86.04);
    // 86.04 − 86.85 = −0.81
    expect(hero.change).toBeCloseTo(-0.81, 10);
    // −0.81 ÷ 86.85 = −0.93%
    expect(hero.changePct).toBeCloseTo(-0.81 / 86.85, 10);
  });

  it("compares with the previous trading day across a weekend, not the previous calendar day", () => {
    const front: FrontPoint[] = [
      { date: "2026-11-05", close: 90.52 },
      { date: "2026-11-06", close: 90.83 }, // Friday
      { date: "2026-11-09", close: 86.85 }, // Monday
    ];
    const hero = heroData(market({ front }))!;
    // 86.85 − 90.83 = −3.98
    expect(hero.change).toBeCloseTo(-3.98, 10);
    expect(hero.changePct).toBeCloseTo(-3.98 / 90.83, 10);
  });

  it("is never the latest close compared with itself", () => {
    const front: FrontPoint[] = [
      { date: "2026-11-09", close: 80 },
      { date: "2026-11-10", close: 82 },
    ];
    const hero = heroData(market({ front }))!;
    expect(hero.change).toBe(2);
    expect(hero.changePct).toBe(0.025);
  });

  it("shows no change on a roll day, when the two closes are different contracts", () => {
    const front: FrontPoint[] = [
      { date: "2026-10-20", close: 90 },
      { date: "2026-10-21", close: 88, roll: true },
    ];
    const hero = heroData(market({ front }))!;
    expect(hero.change).toBeNull();
    expect(hero.changePct).toBeNull();
  });
});

describe("historyData callouts", () => {
  /** One price a day from `from`, moving in a straight line to `to`. */
  function line(from: string, days: number, start: number, end: number): Observation[] {
    const out: Observation[] = [];
    const t0 = Date.parse(from);
    for (let i = 0; i < days; i++) {
      const date = new Date(t0 + i * 86_400_000).toISOString().slice(0, 10);
      out.push({ date, value: start + ((end - start) * i) / (days - 1) });
    }
    return out;
  }

  it("finds the day oil had halved from its 2014 peak, for the 'halved within a year' line", () => {
    // 100 on June 20, 2014, falling in a straight line to 20 by late July 2015.
    const wtiSpot = [...line("2014-06-20", 400, 100, 20)];
    const history = historyData(market({ wtiSpot }))!;
    const priceWar = history.callouts.find((c) => c.key === "priceWar")!;
    expect(priceWar.values.peak).toBe(100);
    // The first close at or below half the peak.
    expect(priceWar.values.half).toBeLessThanOrEqual(50);
    const daysToHalve =
      (Date.parse(priceWar.dates.halfDate) - Date.parse(priceWar.dates.peakDate)) / 86_400_000;
    expect(daysToHalve).toBeGreaterThan(0);
    expect(daysToHalve).toBeLessThanOrEqual(365);
    // The day before was still above half.
    const before = wtiSpot[wtiSpot.findIndex((o) => o.date === priceWar.dates.halfDate) - 1];
    expect(before.value).toBeGreaterThan(50);
  });
});
