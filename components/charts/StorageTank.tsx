"use client";
// A small oil storage tank that fills when later barrels cost more (storing
// pays) and drains when today's barrels cost more (selling now pays).

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

type Props = {
  /** How steep the curve is: (last month − first month) ÷ first month. */
  slope: number;
  /** e.g. "Storage tank: draining" */
  label: string;
};

// The inside of the tank, in the SVG's own coordinates.
const TOP = 8;
const BOTTOM = 72;
const HEIGHT = BOTTOM - TOP;

export default function StorageTank({ slope, label }: Props) {
  const reduceMotion = useReducedMotion();
  const clipId = useId();

  // Start half full, then move up to 35 points either way with the slope.
  const level = 0.5 + Math.max(-0.35, Math.min(0.35, slope * 2.5));
  const startY = TOP + HEIGHT * 0.5;
  const endY = TOP + HEIGHT * (1 - level);

  return (
    <div className="flex shrink-0 items-center gap-2 text-sm text-ink">
      <svg width="44" height="60" viewBox="0 0 60 80" role="img" aria-label={label}>
        <defs>
          <clipPath id={clipId}>
            <rect x="8" y={TOP} width="44" height={HEIGHT} rx="7" />
          </clipPath>
        </defs>
        <motion.rect
          x="8"
          width="44"
          height={HEIGHT}
          fill="var(--crude)"
          clipPath={`url(#${clipId})`}
          initial={{ attrY: reduceMotion ? endY : startY }}
          whileInView={{ attrY: endY }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 2.4, ease: "easeInOut", delay: 0.4 }}
        />
        <rect
          x="8"
          y={TOP}
          width="44"
          height={HEIGHT}
          rx="7"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2"
        />
        {/* Quarter marks on the side, like a gauge. */}
        {[0.25, 0.5, 0.75].map((mark) => (
          <line
            key={mark}
            x1="52"
            x2="57"
            y1={TOP + HEIGHT * mark}
            y2={TOP + HEIGHT * mark}
            stroke="var(--muted)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <span className="max-w-24 leading-tight">{label}</span>
    </div>
  );
}
