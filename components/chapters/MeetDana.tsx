"use client";
// Chapter 1. An oil price slider drives Dana's monthly revenue and profit;
// the profit bar turns red (and is labeled "Loss") below her breakeven cost.

import { motion } from "framer-motion";
import { useId, useState } from "react";
import { copy, fill } from "@/lib/copy";
import { DANA } from "@/lib/dana";
import { dollars, longDate, price as formatPrice } from "@/lib/format";
import { monthlyProfit, monthlyRevenue } from "@/lib/pricing";
import Chapter from "../Chapter";
import ChartFrame from "../charts/ChartFrame";
import { useMode } from "../ModeToggle";
import Slider from "../Slider";
import StatList from "../StatList";

type BarProps = { label: string; value: string; share: number; color: string; hatch?: boolean };

/** One horizontal bar: label on the left, dollar value on the right. */
function Bar({ label, value, share, color, hatch }: BarProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="num text-lg font-semibold text-ink">{value}</span>
      </div>
      <div className="mt-1 h-7 border-l border-ink/60">
        <motion.div
          className="h-full rounded-r"
          style={{
            backgroundColor: color,
            // Diagonal stripes mark a loss, so red is not the only signal.
            backgroundImage: hatch
              ? "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--paper) 45%, transparent) 6px 9px)"
              : undefined,
          }}
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function MeetDana({ today, asOf }: { today: number; asOf: string }) {
  const mode = useMode();
  const text = copy.dana[mode];
  const costId = useId();

  // Clamp in case today's price ever sits outside the slider's range.
  const start = Math.min(DANA.priceMax, Math.max(DANA.priceMin, Math.round(today)));
  const [oil, setOil] = useState(start);
  const [cost, setCost] = useState<number>(DANA.defaultCost);

  const revenue = monthlyRevenue(oil, DANA.volume);
  const totalCost = monthlyRevenue(cost, DANA.volume);
  const profit = monthlyProfit(oil, cost, DANA.volume);
  // Bars share one scale: the most revenue the slider can produce.
  const scale = monthlyRevenue(DANA.priceMax, DANA.volume);

  const values = {
    price: formatPrice(oil),
    cost: formatPrice(cost),
    profit: dollars(profit),
    loss: dollars(-profit),
    today: formatPrice(today),
    date: longDate(asOf),
    tenDollarMove: dollars(monthlyRevenue(10, DANA.volume)),
    delta: dollars(monthlyRevenue(1, DANA.volume)),
    volume: DANA.volume.toLocaleString("en-US"),
    margin: formatPrice(oil - cost),
  };

  const title = fill(
    profit > 0 ? text.chartProfit : profit < 0 ? text.chartLoss : text.chartEven,
    // In Desk mode a loss reads as a negative P&L in parentheses.
    mode === "desk" ? { ...values, loss: dollars(profit) } : values,
  );

  const chart = (
    <ChartFrame title={title} footnote={fill(text.footnote, values)} height="">
      <div className="space-y-5">
        <Bar label={text.revenue} value={dollars(revenue)} share={revenue / scale} color="var(--crude)" />
        <Bar label={text.cost} value={dollars(totalCost)} share={totalCost / scale} color="var(--muted)" />
        <Bar
          label={profit < 0 ? text.loss : text.profit}
          value={dollars(profit)}
          share={Math.abs(profit) / scale}
          color={profit < 0 ? "var(--loss)" : "var(--gain)"}
          hatch={profit < 0}
        />
      </div>
    </ChartFrame>
  );

  const controls = (
    <div className="space-y-5">
      <Slider
        label={text.priceLabel}
        display={formatPrice(oil)}
        value={oil}
        min={DANA.priceMin}
        max={DANA.priceMax}
        onChange={setOil}
        minLabel={`$${DANA.priceMin}`}
        maxLabel={`$${DANA.priceMax}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <label htmlFor={costId} className="text-sm font-medium text-muted">
          {text.costLabel}{" "}
          <span className="rounded-full border border-rule px-2 py-0.5 text-xs">
            {copy.common.illustrative}
          </span>
        </label>
        <span className="num flex items-center gap-1 text-lg font-semibold">
          $
          <input
            id={costId}
            type="number"
            inputMode="decimal"
            min={0}
            max={DANA.priceMax}
            step={1}
            value={cost}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) setCost(Math.max(0, Math.min(DANA.priceMax, next)));
            }}
            className="num h-11 w-24 rounded border border-rule bg-paper px-2 text-right text-ink focus-visible:outline-2 focus-visible:outline-crude"
          />
        </span>
      </div>
      {mode === "desk" && (
        <StatList
          stats={[
            {
              label: copy.dana.desk_stats.exposure,
              value: fill(copy.dana.desk_stats.exposureValue, values),
            },
            {
              label: copy.dana.desk_stats.delta,
              value: fill(copy.dana.desk_stats.deltaValue, values),
            },
            {
              label: copy.dana.desk_stats.margin,
              value: fill(copy.dana.desk_stats.marginValue, values),
              tone: oil - cost < 0 ? "loss" : "gain",
            },
          ]}
        />
      )}
    </div>
  );

  return (
    <Chapter
      id="dana"
      kicker={text.kicker}
      title={text.title}
      chart={chart}
      controls={controls}
      body={text.body.map((paragraph) => fill(paragraph, values))}
      aha={text.aha}
    />
  );
}
