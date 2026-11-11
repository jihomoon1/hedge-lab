import { describe, expect, it } from "vitest";
import { realizedVol } from "./pricing";

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
