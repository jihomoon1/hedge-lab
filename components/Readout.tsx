"use client";
// A label with one big number next to it, used for premiums and costs.

import type { ReactNode } from "react";

type Props = {
  label: ReactNode;
  value: string;
  /** Small text after the number, e.g. "per barrel" */
  unit?: string;
  tone?: "gain" | "loss";
};

export default function Readout({ label, value, unit, tone }: Props) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="text-right">
        <span
          className={`num text-xl font-semibold ${
            tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-ink"
          }`}
        >
          {value}
        </span>
        {unit && <span className="ml-1.5 text-sm text-muted">{unit}</span>}
      </span>
    </div>
  );
}
