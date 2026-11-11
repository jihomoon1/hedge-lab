"use client";
// An underlined word that shows a one-line definition on hover, keyboard
// focus or tap, plus what the same idea is called in the other vocabulary.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { copy, terms, type TermKey } from "@/lib/copy";
import { useMode } from "./ModeToggle";

const TIP_WIDTH = 256; // matches the w-64 class below
const EDGE_GAP = 8;

export default function Term({ k, children }: { k: TermKey; children?: ReactNode }) {
  const mode = useMode();
  const id = useId();
  const wrapper = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const term = terms[k];
  const other = mode === "plain" ? "desk" : "plain";

  function show() {
    // Slide the tip left if it would otherwise run off the screen's right edge.
    const left = wrapper.current?.getBoundingClientRect().left ?? 0;
    const width = Math.min(TIP_WIDTH, window.innerWidth - 2 * EDGE_GAP);
    const overflow = left + width - (window.innerWidth - EDGE_GAP);
    setShift(overflow > 0 ? -overflow : 0);
    setOpen(true);
  }

  // While open, a tap anywhere else or the Escape key closes the tip.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span
      ref={wrapper}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
    >
      {/* A span, not a <button>, so a multi-word term can wrap across lines
          like normal text; role and tabIndex keep it usable from the keyboard. */}
      <span
        role="button"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onClick={show}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            show();
          }
        }}
        className="cursor-help rounded-xs underline decoration-dotted decoration-1 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crude"
      >
        {children ?? term[mode]}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{ transform: `translateX(${shift}px)` }}
          className="absolute top-full left-0 z-40 mt-1 block w-64 max-w-[calc(100vw-16px)] rounded border border-rule bg-paper px-3 py-2 text-left font-sans text-sm leading-snug font-normal text-ink shadow-md"
        >
          <span className="block">{term.def}</span>
          <span className="mt-1 block text-xs text-muted">
            {copy.toggle[other]}: {term[other]}
          </span>
        </span>
      )}
    </span>
  );
}
