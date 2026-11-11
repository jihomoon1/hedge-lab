"use client";
// Renders a line of text from lib/copy.ts, turning **bold** into bold and
// [[term]] or [[term|shown words]] into an underlined Term with a definition.

import { Fragment } from "react";
import { terms, type TermKey } from "@/lib/copy";
import Term from "./Term";

const TOKEN = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g;

export default function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("[[")) {
          const [key, shown] = part.slice(2, -2).split("|");
          if (key in terms) {
            return (
              <Term key={i} k={key as TermKey}>
                {shown}
              </Term>
            );
          }
          return <Fragment key={i}>{shown ?? key}</Fragment>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
