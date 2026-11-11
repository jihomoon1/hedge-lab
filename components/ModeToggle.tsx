"use client";
// The Plain English ↔ Desk Speak switch, pinned top-right, plus the useMode()
// hook every component uses to ask "which vocabulary are we in?".

import { useSyncExternalStore } from "react";
import { copy, MODE_STORAGE_KEY, type Mode } from "@/lib/copy";

// The current mode lives on the <html> tag as data-mode="plain" or "desk",
// which is also what switches the color theme in globals.css.
const listeners = new Set<() => void>();

const readMode = (): Mode =>
  document.documentElement.dataset.mode === "desk" ? "desk" : "plain";

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The current mode. Re-renders the component whenever the switch is flipped. */
export function useMode(): Mode {
  return useSyncExternalStore(subscribe, readMode, () => "plain");
}

function setMode(mode: Mode) {
  const root = document.documentElement;
  // "mode-fade" turns on a 300ms color transition just for the switch, so
  // the two themes cross-fade instead of snapping.
  root.classList.add("mode-fade");
  root.dataset.mode = mode;
  window.setTimeout(() => root.classList.remove("mode-fade"), 350);
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // Private browsing can block storage; the switch still works for this visit.
  }
  listeners.forEach((listener) => listener());
}

export default function ModeToggle() {
  const mode = useMode();
  const options: Mode[] = ["plain", "desk"];
  return (
    <div
      role="radiogroup"
      aria-label={copy.toggle.label}
      className="fixed top-3 right-3 z-50 flex rounded-full border border-rule bg-paper p-1 text-xs font-medium shadow-sm"
    >
      {options.map((option) => {
        const selected = mode === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setMode(option)}
            className={`min-h-9 rounded-full px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crude ${
              selected ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {/* Phones get the short label so the switch covers less of the page. */}
            <span className="sm:hidden" aria-hidden>
              {copy.toggle[`${option}Short`]}
            </span>
            <span className="sr-only sm:not-sr-only">{copy.toggle[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
