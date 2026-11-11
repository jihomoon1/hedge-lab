"use client";
// The Cheap / Fair / Rich dial for chapter 8: a half circle in three equal
// zones with a needle at today's percentile.

type Props = {
  /** Where the needle points, 0 (far left) to 100 (far right) */
  percentile: number;
  /** The three zone names, left to right */
  zones: [string, string, string];
  /** Which zone the needle is in: 0, 1 or 2 */
  active: number;
  /** Read out by screen readers in place of the drawing */
  label: string;
};

// The dial's geometry, in the drawing's own units.
const CX = 160;
const CY = 150;
const RADIUS = 112;
const ZONE_EDGES = [0, 100 / 3, 200 / 3, 100];

/** The point on the dial's arc at a percentile (0 = left end, 100 = right end). */
function onArc(percentile: number, radius: number): [number, number] {
  const angle = Math.PI * (1 - percentile / 100);
  return [CX + radius * Math.cos(angle), CY - radius * Math.sin(angle)];
}

/** An SVG path for the piece of the arc between two percentiles. */
function arcPath(from: number, to: number): string {
  const [x1, y1] = onArc(from, RADIUS);
  const [x2, y2] = onArc(to, RADIUS);
  return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}`;
}

export default function VolDial({ percentile, zones, active, label }: Props) {
  const clamped = Math.min(100, Math.max(0, percentile));
  const [needleX, needleY] = onArc(clamped, RADIUS - 26);
  // Zone names sit just outside the arc: left, top and right.
  const labelSpots: { at: [number, number]; anchor: "start" | "middle" | "end" }[] = [
    { at: onArc(100 / 6, RADIUS + 20), anchor: "end" },
    { at: onArc(50, RADIUS + 20), anchor: "middle" },
    { at: onArc(500 / 6, RADIUS + 20), anchor: "start" },
  ];

  return (
    <svg viewBox="0 0 320 196" role="img" aria-label={label} className="mx-auto h-full max-w-full">
      {zones.map((zone, i) => (
        <path
          key={zone}
          // A small gap between zones so each reads as its own piece.
          d={arcPath(ZONE_EDGES[i] + (i === 0 ? 0 : 1), ZONE_EDGES[i + 1] - (i === 2 ? 0 : 1))}
          fill="none"
          stroke={i === active ? "var(--crude)" : "var(--rule)"}
          strokeWidth={i === active ? 20 : 14}
        />
      ))}
      {zones.map((zone, i) => (
        <text
          key={zone}
          x={labelSpots[i].at[0]}
          y={labelSpots[i].at[1]}
          textAnchor={labelSpots[i].anchor}
          fontSize="13"
          fontWeight={i === active ? 700 : 400}
          fill={i === active ? "var(--ink)" : "var(--muted)"}
        >
          {zone}
        </text>
      ))}
      <line
        x1={CX}
        y1={CY}
        x2={needleX}
        y2={needleY}
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={CX} cy={CY} r="7" fill="var(--ink)" />
      <text
        x={CX}
        y={CY + 38}
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fill="var(--ink)"
        className="font-serif"
      >
        {zones[active]}
      </text>
    </svg>
  );
}
