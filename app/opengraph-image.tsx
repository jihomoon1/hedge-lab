// The picture shown when the site's link is shared (iMessage, LinkedIn...):
// the site name and the latest WTI price, drawn fresh from market.json.

import { ImageResponse } from "next/og";
import { copy, fill } from "@/lib/copy";
import { longDate, usd } from "@/lib/format";
import { heroData, loadMarket } from "@/lib/market";

export const alt = copy.meta.imageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The same colors as Desk Speak mode in globals.css.
const PAPER = "#0b0d0e";
const INK = "#e6e1d6";
const MUTED = "#8a8f93";
const AMBER = "#ffb000";
const GREEN = "#3ddc84";

export default async function Image() {
  const market = await loadMarket();
  const hero = market ? heroData(market) : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: PAPER,
        color: INK,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>
          {copy.meta.name}
        </div>
        <div style={{ marginTop: 12, fontSize: 38, color: MUTED }}>
          {copy.meta.tagline}
        </div>
      </div>

      {/* A payoff diagram: the unhedged diagonal and a hedge with a floor. */}
      <svg
        width="440"
        height="190"
        viewBox="0 0 440 190"
        style={{ position: "absolute", left: 688, top: 250 }}
      >
        <path
          d="M0 180 L440 10"
          fill="none"
          stroke={AMBER}
          strokeWidth="4"
          strokeDasharray="14 10"
        />
        <path
          d="M0 110 H180 L440 28"
          fill="none"
          stroke={GREEN}
          strokeWidth="7"
        />
      </svg>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        {hero ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, color: MUTED }}>
              {copy.meta.priceLabel}
            </div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <div style={{ fontSize: 120, fontWeight: 700, color: AMBER }}>
                {usd(hero.settle)}
              </div>
              <div style={{ marginLeft: 20, fontSize: 34, color: MUTED }}>
                {copy.meta.priceUnit}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}
        <div style={{ fontSize: 28, color: MUTED }}>
          {hero ? fill(copy.meta.asOf, { date: longDate(hero.asOf) }) : ""}
        </div>
      </div>
    </div>,
    size,
  );
}
