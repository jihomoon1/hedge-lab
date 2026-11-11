"use client";
// A compact label/value list for Desk mode: monospace numbers, right-aligned,
// the way a trading screen shows them.

import type { ReactNode } from "react";

export type Stat = {
  label: ReactNode;
  value: string;
  /** Optional small line under the value, e.g. the math behind it. */
  note?: string;
  /** Colors the value as a gain or a loss (the sign or parentheses still show it). */
  tone?: "gain" | "loss";
};

export default function StatList({ stats }: { stats: Stat[] }) {
  return (
    <dl className="divide-y divide-rule border-y border-rule font-mono text-sm">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-muted">{stat.label}</dt>
          <dd className="text-right">
            <span
              className={`num ${
                stat.tone === "gain" ? "text-gain" : stat.tone === "loss" ? "text-loss" : "text-ink"
              }`}
            >
              {stat.value}
            </span>
            {stat.note && <span className="block text-xs text-muted">{stat.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
