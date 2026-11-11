"use client";
// The layout every chapter shares: on desktop, text on the left (about 40%)
// and a chart that stays pinned on the right; on mobile, the chart sits on
// top and the text follows underneath.

import type { ReactNode } from "react";
import { useMode } from "./ModeToggle";
import RichText from "./RichText";

type Props = {
  id: string;
  kicker: string;
  title: string;
  /** The chart panel (pinned on desktop). */
  chart: ReactNode;
  /** Sliders, buttons and readouts. */
  controls?: ReactNode;
  /** Paragraphs from lib/copy.ts. */
  body: readonly string[];
  /** Anything extra under the paragraphs, like a list. */
  extra?: ReactNode;
  /** The chapter's closing line, shown in bold. */
  aha: string;
};

export default function Chapter({ id, kicker, title, chart, controls, body, extra, aha }: Props) {
  const mode = useMode();
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-rule">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:grid lg:grid-cols-[2fr_3fr] lg:gap-x-12">
        <header className="pt-16 lg:col-start-1 lg:pt-[16vh]">
          <p className="text-sm font-medium tracking-wide text-muted uppercase">{kicker}</p>
          <h2
            id={`${id}-title`}
            className={`mt-2 font-serif leading-tight text-balance ${
              mode === "desk" ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
            }`}
          >
            {title}
          </h2>
        </header>

        {/* On desktop this cell spans the full height of the chapter, and the
            chart inside it sticks to the top of the screen while you scroll. */}
        <div className="mt-6 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mt-0">
          <div className="lg:sticky lg:top-0 lg:flex lg:min-h-svh lg:flex-col lg:justify-center lg:py-16">
            {chart}
          </div>
        </div>

        {controls && <div className="mt-6 lg:col-start-1">{controls}</div>}

        <div className="mt-6 space-y-4 text-lg leading-relaxed lg:col-start-1">
          {body.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} />
            </p>
          ))}
          {extra}
        </div>

        <p className="mt-8 pb-16 font-serif text-xl leading-snug font-semibold text-balance sm:text-2xl lg:col-start-1 lg:pb-[30vh]">
          {aha}
        </p>
      </div>
    </section>
  );
}
