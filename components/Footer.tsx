// The footer: a glossary of every underlined term, where the data comes
// from and how fresh it is, who built the site, and the disclaimer.

import { copy, fill, terms } from "@/lib/copy";
import { longDate } from "@/lib/format";

/** The latest date of each data feed, "YYYY-MM-DD", or null if nothing has loaded. */
export type FooterDates = Record<
  "futures" | "spot" | "ovx" | "tbill",
  string
> | null;

const LINK =
  "underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crude";

export default function Footer({ dates }: { dates: FooterDates }) {
  const text = copy.footer;
  // In the order the story introduces them.
  const glossary = Object.entries(terms);

  return (
    <footer className="border-t border-rule bg-paper text-ink">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <h2 className="font-serif text-2xl sm:text-3xl">
          {text.glossaryTitle}
        </h2>
        <p className="mt-2 text-sm text-muted">{text.glossaryIntro}</p>
        <dl className="mt-6 grid gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {glossary.map(([key, term]) => (
            <div key={key}>
              <dt className="font-medium">
                <span className="block first-letter:uppercase">
                  {term.plain}
                </span>
                <span className="num mt-0.5 block text-sm font-normal text-muted">
                  {text.deskHeading}: {term.desk}
                </span>
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink">
                {term.def}
              </dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-16 font-serif text-2xl sm:text-3xl">
          {text.sourcesTitle}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {dates ? text.asOf : text.noData}
        </p>
        <ul className="mt-5 space-y-3 text-sm">
          {text.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className={`${LINK} font-medium`}
              >
                {source.name}
              </a>
              <span className="text-ink">: {source.detail}</span>
              {dates && (
                <span className="text-muted">
                  {" "}
                  ({fill(text.latest, { date: longDate(dates[source.date]) })})
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-16 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-rule pt-6 text-sm">
          <p>
            {text.builtBy}
            {" · "}
            <a
              href={text.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className={LINK}
            >
              {text.linkedin}
            </a>
            {" · "}
            <a
              href={text.githubUrl}
              target="_blank"
              rel="noreferrer"
              className={LINK}
            >
              {text.github}
            </a>
          </p>
          <p className="text-muted">{text.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
