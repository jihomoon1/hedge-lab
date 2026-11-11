"use client";
// Chapter 0. Shows the latest WTI close as a big number that counts up, a
// one-year sparkline and the opening question; Desk mode adds change and vol.
// It follows the Plain English / Desk Speak switch like every other chapter.

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { copy, fill, type Mode } from "@/lib/copy";
import { longDate, shortDate, signedPct, usd } from "@/lib/format";
import type { HeroData } from "@/lib/market";
import { useMode } from "../ModeToggle";

/** Signed dollars, negatives in parentheses: +$0.32 or ($0.81). */
const usdChange = (n: number) => (n < 0 ? usd(n) : `+${usd(n)}`);

/** The big number: counts up from zero once, when the page loads. */
function CountUp({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const current = useMotionValue(0);
  const text = useTransform(current, (v) => usd(v));

  useEffect(() => {
    if (reduceMotion) {
      current.set(value);
      return;
    }
    const controls = animate(current, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [current, value, reduceMotion]);

  return (
    <>
      {/* Screen readers get the real number, not every frame of the animation. */}
      <span className="sr-only">{usd(value)}</span>
      <motion.span aria-hidden>{text}</motion.span>
    </>
  );
}

type TooltipProps = {
  active?: boolean;
  payload?: readonly { payload: { date: string; close: number } }[];
};

function SparkTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded border border-rule bg-paper px-2.5 py-1.5 text-sm shadow-sm">
      <div className="text-muted">{shortDate(point.date)}</div>
      <div className="font-medium text-ink tabular-nums">{usd(point.close)}</div>
    </div>
  );
}

function Sparkline({ data, mode }: { data: HeroData; mode: Mode }) {
  const start = data.year[0].date;
  const end = data.year[data.year.length - 1].date;
  return (
    <figure>
      <figcaption className="mb-3 text-base text-ink">
        {fill(copy.hero[mode].chartTitle, {
          low: usd(data.yearLow),
          high: usd(data.yearHigh),
        })}
      </figcaption>
      <div
        className="h-28 sm:h-36"
        role="img"
        aria-label={fill(copy.hero.chartLabel, {
          start: longDate(start),
          end: longDate(end),
        })}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.year} margin={{ top: 6, right: 4, bottom: 6, left: 4 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip
              content={<SparkTooltip />}
              cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="var(--crude)"
              strokeWidth={mode === "plain" ? 2.5 : 1.5}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--paper)", strokeWidth: 2 }}
              animationDuration={1400}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{shortDate(start)}</span>
        <span>{shortDate(end)}</span>
      </div>
    </figure>
  );
}

function DeskStats({ data }: { data: HeroData }) {
  const text = copy.hero.desk;
  const direction =
    data.change === null || data.change === 0
      ? "text-ink"
      : data.change > 0
        ? "text-gain"
        : "text-loss";
  return (
    <dl className="mt-6 grid max-w-md grid-cols-2 gap-x-8 border-t border-rule pt-4 font-mono text-sm">
      <div>
        <dt className="text-muted">{text.dayChange}</dt>
        <dd className={`mt-1 tabular-nums ${direction}`}>
          {data.change === null || data.changePct === null
            ? text.dayChangeRolled
            : `${usdChange(data.change)}  ${signedPct(data.changePct, 2)}`}
        </dd>
      </div>
      <div>
        <dt className="text-muted">{text.realizedVol}</dt>
        <dd className="mt-1 text-ink tabular-nums">
          {data.rv30 === null ? "n/a" : `${(data.rv30 * 100).toFixed(1)}%`}
        </dd>
      </div>
    </dl>
  );
}

export default function Hero({ data }: { data: HeroData | null }) {
  const mode = useMode();
  if (!data) {
    return (
      <section className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-4 py-16 sm:px-8">
        <h1 className="font-serif text-3xl">{copy.hero.noData.title}</h1>
        <p className="mt-3 text-muted">{copy.hero.noData.body}</p>
      </section>
    );
  }

  const text = copy.hero[mode];
  return (
    <section className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-4 py-16 sm:px-8">
      <p className="text-sm font-medium tracking-wide text-muted uppercase">{text.eyebrow}</p>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-4">
        <span
          className={`text-7xl font-semibold tracking-tight tabular-nums sm:text-9xl ${
            mode === "desk" ? "font-mono" : "font-sans"
          }`}
        >
          <CountUp value={data.settle} />
        </span>
        <span className="text-xl text-muted">{text.unit}</span>
      </p>

      <p className="mt-3 text-sm text-muted">
        {fill(text.asOf, { date: longDate(data.asOf) })}
      </p>

      {mode === "desk" && <DeskStats data={data} />}

      <div className="mt-12">
        <Sparkline data={data} mode={mode} />
      </div>

      <h1
        className={`mt-14 max-w-3xl font-serif leading-tight text-balance ${
          mode === "desk" ? "text-2xl sm:text-3xl" : "text-3xl sm:text-5xl"
        }`}
      >
        {text.question}
      </h1>
    </section>
  );
}
