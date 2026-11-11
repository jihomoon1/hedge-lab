// The one long page: the Hero, then each chapter in order. All market data is
// loaded once here and handed down to the chapters.

import Collar from "@/components/chapters/Collar";
import Curve from "@/components/chapters/Curve";
import Hero from "@/components/chapters/Hero";
import History from "@/components/chapters/History";
import MeetDana from "@/components/chapters/MeetDana";
import Put from "@/components/chapters/Put";
import Swap from "@/components/chapters/Swap";
import ThreeWay from "@/components/chapters/ThreeWay";
import { HedgeProvider } from "@/components/HedgeState";
import Footer, { type FooterDates } from "@/components/Footer";
import ModeToggle from "@/components/ModeToggle";
import Sandbox from "@/components/chapters/Sandbox";
import VolGauge from "@/components/chapters/VolGauge";
import {
  curveData,
  heroData,
  historyData,
  loadMarket,
  optionData,
  sandboxData,
  volData,
} from "@/lib/market";

export default async function Home() {
  const market = await loadMarket();
  const hero = market ? heroData(market) : null;
  const history = market ? historyData(market) : null;
  const curve = market ? curveData(market) : null;
  const options = market ? optionData(market) : null;
  const vol = market ? volData(market) : null;
  const sandbox = market ? sandboxData(market) : null;

  // The latest date of each feed, for the footer's "Data and sources" list.
  const dates: FooterDates =
    market &&
    market.wtiSpot.length > 0 &&
    market.ovx.length > 0 &&
    market.front.length > 0
      ? {
          futures: market.asOf,
          spot: market.wtiSpot[market.wtiSpot.length - 1].date,
          ovx: market.ovx[market.ovx.length - 1].date,
          tbill: market.tbill3m.date,
        }
      : null;

  return (
    <>
      <main className="bg-paper text-ink">
        <ModeToggle />
        <Hero data={hero} />
        {hero && <MeetDana today={hero.settle} asOf={hero.asOf} />}
        {history && <History data={history} />}
        {curve && <Curve data={curve} />}
        {hero && curve && <Swap curve={curve} today={hero.settle} />}
        {/* Chapters 5 to 7 share one hedge: each starts from the one before. */}
        {options && (
          <HedgeProvider data={options}>
            <Put />
            <Collar />
            <ThreeWay />
          </HedgeProvider>
        )}
        {vol && <VolGauge data={vol} />}
        {sandbox && <Sandbox data={sandbox} />}
      </main>
      <Footer dates={dates} />
    </>
  );
}
