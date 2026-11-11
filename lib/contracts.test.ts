import { describe, expect, it } from "vitest";
import {
  contractTicker,
  expiriesBetween,
  lastTradeDate,
  nextContracts,
} from "./contracts";

describe("contractTicker", () => {
  it("uses the SPEC format: CL + month code + two-digit year + .NYM", () => {
    expect(contractTicker(2026, 12)).toBe("CLZ26.NYM");
    expect(contractTicker(2027, 1)).toBe("CLF27.NYM");
    expect(contractTicker(2027, 8)).toBe("CLQ27.NYM");
  });
});

describe("lastTradeDate", () => {
  // Real expiry dates from the CME calendar.
  it("is 3 business days before the 25th when the 25th is a business day", () => {
    expect(lastTradeDate(2024, 2)).toBe("2024-01-22");
    expect(lastTradeDate(2026, 12)).toBe("2026-11-20");
  });

  it("is 4 business days before the 25th when the 25th is a weekend", () => {
    expect(lastTradeDate(2020, 5)).toBe("2020-04-21");
    expect(lastTradeDate(2025, 2)).toBe("2025-01-21");
  });

  it("treats Christmas as a non-business day", () => {
    expect(lastTradeDate(2026, 1)).toBe("2025-12-19");
  });
});

describe("nextContracts", () => {
  it("starts at the first contract that has not expired", () => {
    const list = nextContracts("2026-11-11");
    expect(list).toHaveLength(12);
    expect(list[0].ticker).toBe("CLZ26.NYM");
    expect(list[1].ticker).toBe("CLF27.NYM");
    expect(list[11].ticker).toBe("CLX27.NYM");
    expect(list[0].month).toBe("2026-12");
  });

  it("still counts a contract on its last trading day, then moves on", () => {
    expect(nextContracts("2026-11-20")[0].ticker).toBe("CLZ26.NYM");
    expect(nextContracts("2026-11-21")[0].ticker).toBe("CLF27.NYM");
  });
});

describe("expiriesBetween", () => {
  it("lists each monthly expiry inside the window", () => {
    expect(expiriesBetween("2024-01-01", "2024-03-31")).toEqual([
      "2024-01-22",
      "2024-02-20",
      "2024-03-20",
    ]);
  });
});
