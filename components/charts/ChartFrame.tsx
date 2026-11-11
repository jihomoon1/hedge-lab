"use client";
// The frame around every chart: a sentence title that states the point, the
// chart itself (drawn only once it scrolls into view) and an "as of" line.

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useMode } from "../ModeToggle";

type Props = {
  /** A full sentence that states what the chart shows. */
  title: string;
  /** e.g. "As of November 10, 2026 · Source: ..." */
  footnote: string;
  /** Tailwind height classes for the chart area, e.g. "h-72 sm:h-96". */
  height: string;
  /** Optional row between the title and the chart, e.g. a legend. */
  legend?: ReactNode;
  children: ReactNode;
};

export default function ChartFrame({ title, footnote, height, legend, children }: Props) {
  const mode = useMode();
  const ref = useRef<HTMLDivElement>(null);
  // Waiting until the chart is on screen means its draw-in animation plays
  // when the reader arrives, not while it is still off screen.
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

  return (
    <figure>
      <figcaption
        className={`font-serif leading-snug text-balance ${
          mode === "desk" ? "text-lg" : "text-xl sm:text-2xl"
        }`}
      >
        {title}
      </figcaption>
      {legend && <div className="mt-3">{legend}</div>}
      <div ref={ref} className={`mt-4 ${height}`}>
        {inView && (
          <motion.div
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">{footnote}</p>
    </figure>
  );
}
