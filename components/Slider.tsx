"use client";
// A full-width slider with a label and a live value, with a thumb big enough
// to drag comfortably on a phone.

import { useId } from "react";

type Props = {
  label: string;
  /** The current value, already formatted for display, e.g. "$86". */
  display: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Labels under the two ends of the track. */
  minLabel?: string;
  maxLabel?: string;
};

export default function Slider({
  label,
  display,
  value,
  min,
  max,
  step = 1,
  onChange,
  minLabel,
  maxLabel,
}: Props) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-muted">
          {label}
        </label>
        <output htmlFor={id} className="num text-xl font-semibold text-ink">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {(minLabel || maxLabel) && (
        <div className="num flex justify-between text-xs text-muted">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
