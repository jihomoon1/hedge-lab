import { describe, expect, it } from "vitest";
import { cleanBars, markRolls, newYorkDate, parseFredObservations } from "./feeds";

describe("newYorkDate", () => {
  it("uses the New York calendar day, not UTC", () => {
    // 03:00 UTC on Nov 11 is still 10pm on Nov 10 in New York.
    expect(newYorkDate(new Date("2026-11-11T03:00:00Z"))).toBe("2026-11-10");
    expect(newYorkDate(new Date("2026-11-11T05:00:00Z"))).toBe("2026-11-11");
  });
});

describe("cleanBars", () => {
  const bars = [
    { date: new Date("2026-11-09T05:00:00Z"), close: 86.8499984741211 },
    { date: new Date("2026-11-06T05:00:00Z"), close: 90.83000183105469 },
    { date: new Date("2026-11-10T05:00:00Z"), close: null },
    { date: new Date("2026-11-11T05:00:00Z"), close: 86.36000061035156 },
  ];

  it("rounds to cents, sorts oldest first and drops missing closes", () => {
    expect(cleanBars(bars, "2026-11-12")).toEqual([
      { date: "2026-11-06", close: 90.83 },
      { date: "2026-11-09", close: 86.85 },
      { date: "2026-11-11", close: 86.36 },
    ]);
  });

  it("drops today's bar because that session has not settled", () => {
    const dates = cleanBars(bars, "2026-11-11").map((b) => b.date);
    expect(dates).toEqual(["2026-11-06", "2026-11-09"]);
  });
});

describe("markRolls", () => {
  it("flags the first bar after a contract expiry (CLZ26 expires 2026-11-20)", () => {
    const points = ["2026-11-19", "2026-11-20", "2026-11-23", "2026-11-24"].map(
      (date) => ({ date, close: 80 }),
    );
    expect(markRolls(points).map((p) => Boolean(p.roll))).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });
});

describe("parseFredObservations", () => {
  it('skips FRED\'s "." placeholder for missing days', () => {
    const parsed = parseFredObservations({
      observations: [
        { date: "2026-11-05", value: "88.12" },
        { date: "2026-11-06", value: "." },
        { date: "2026-11-09", value: "86.9" },
      ],
    });
    expect(parsed).toEqual([
      { date: "2026-11-05", value: 88.12 },
      { date: "2026-11-09", value: 86.9 },
    ]);
  });

  it("returns an empty list when FRED sends no observations", () => {
    expect(parseFredObservations({})).toEqual([]);
  });
});
