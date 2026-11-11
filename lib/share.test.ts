import { describe, expect, it } from "vitest";
import type { Leg } from "./pricing";
import { decodeLegs, encodeLegs } from "./share";

const threeWay: Leg[] = [
  { type: "longPut", strike: 71, volume: 10_000 },
  { type: "shortPut", strike: 60, volume: 10_000 },
  { type: "shortCall", strike: 93.472135, volume: 10_000 },
  { type: "swap", strike: 79.42, volume: 2_500 },
];

describe("encodeLegs / decodeLegs", () => {
  it("encode then decode returns the identical structure", () => {
    expect(decodeLegs(encodeLegs(threeWay))).toEqual(threeWay);
  });

  it("writes a short, readable piece of text that needs no escaping in a URL", () => {
    const text = encodeLegs(threeWay);
    expect(text).toBe("lp_71_10000-sp_60_10000-sc_93.472135_10000-sw_79.42_2500");
    expect(encodeURIComponent(text)).toBe(text);
  });

  it("round-trips all six legs, including a zero volume", () => {
    const six: Leg[] = [
      ...threeWay,
      { type: "longPut", strike: 50.5, volume: 0 },
      { type: "shortCall", strike: 120, volume: 12_345 },
    ];
    expect(decodeLegs(encodeLegs(six))).toEqual(six);
  });

  it("round-trips an empty hedge", () => {
    expect(encodeLegs([])).toBe("none");
    expect(decodeLegs("none")).toEqual([]);
  });

  it("rejects text that is not a valid hedge", () => {
    expect(decodeLegs(null)).toBeNull();
    expect(decodeLegs("")).toBeNull();
    expect(decodeLegs("hello")).toBeNull();
    expect(decodeLegs("xx_70_1000")).toBeNull(); // unknown leg type
    expect(decodeLegs("lp_-70_1000")).toBeNull(); // negative strike
    expect(decodeLegs("lp_70")).toBeNull(); // missing volume
    expect(decodeLegs("lp_70_1e9")).toBeNull(); // not a plain number
    expect(decodeLegs("lp_70_99999999")).toBeNull(); // volume too large
    expect(decodeLegs(Array(7).fill("lp_70_1000").join("-"))).toBeNull(); // more than 6 legs
  });
});
