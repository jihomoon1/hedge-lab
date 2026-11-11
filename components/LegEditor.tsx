"use client";
// One row of the hedge desk: a leg's type, its strike and its volume, with a
// remove button, a one-line description and what the leg costs up front.

import { useId, useState } from "react";
import type { Leg, LegType } from "@/lib/pricing";
import { MAX_STRIKE, MAX_VOLUME } from "@/lib/share";

const FIELD =
  "num h-11 w-full rounded border border-rule bg-paper px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-crude";

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

/**
 * A number box that updates the hedge on every keystroke that is a valid
 * number, but lets you clear it or type "7" on the way to "75" without the
 * box fighting back.
 */
function NumberField({ label, value, min, max, step, onChange }: NumberFieldProps) {
  const id = useId();
  // While you are typing, the box shows exactly what you typed.
  const [draft, setDraft] = useState<string | null>(null);
  // Otherwise it shows the leg's value, to the cent.
  const shown = draft ?? String(Number(value.toFixed(2)));

  return (
    <div>
      <label htmlFor={id} className="block text-xs text-muted">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className={`${FIELD} mt-1`}
        value={shown}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const text = event.target.value;
          setDraft(text);
          const typed = Number(text);
          if (text !== "" && Number.isFinite(typed) && typed >= min && typed <= max) {
            onChange(typed);
          }
        }}
        onBlur={() => setDraft(null)}
      />
    </div>
  );
}

type Props = {
  leg: Leg;
  /** The one-line description, e.g. "Short 75 call x 10k" */
  summary: string;
  /** What the leg costs or pays up front, as a sentence */
  premiumLine: string;
  labels: {
    type: string;
    strike: string;
    volume: string;
    remove: string;
    types: Record<LegType, string>;
  };
  onChange: (leg: Leg) => void;
  onRemove: () => void;
};

const TYPE_ORDER: LegType[] = ["swap", "longPut", "shortPut", "shortCall"];

export default function LegEditor({ leg, summary, premiumLine, labels, onChange, onRemove }: Props) {
  const typeId = useId();
  return (
    <li className="rounded border border-rule p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="num pt-1 text-sm font-semibold text-ink">{summary}</p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={labels.remove}
          title={labels.remove}
          className="-mt-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-crude"
        >
          <span aria-hidden>×</span>
        </button>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor={typeId} className="block text-xs text-muted">
            {labels.type}
          </label>
          <select
            id={typeId}
            className={`${FIELD} mt-1`}
            value={leg.type}
            onChange={(event) => onChange({ ...leg, type: event.target.value as LegType })}
          >
            {TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {labels.types[type]}
              </option>
            ))}
          </select>
        </div>
        <NumberField
          label={labels.strike}
          value={leg.strike}
          min={1}
          max={MAX_STRIKE}
          step={1}
          onChange={(strike) => onChange({ ...leg, strike })}
        />
        <NumberField
          label={labels.volume}
          value={leg.volume}
          min={0}
          max={MAX_VOLUME}
          step={1000}
          onChange={(volume) => onChange({ ...leg, volume })}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{premiumLine}</p>
    </li>
  );
}
