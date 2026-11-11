// The one long page: the Hero, then each chapter in order. All market data is
// loaded once here and handed down to the chapters.

import Curve from "@/components/chapters/Curve";
import Hero from "@/components/chapters/Hero";
import History from "@/components/chapters/History";
import MeetDana from "@/components/chapters/MeetDana";
import Swap from "@/components/chapters/Swap";
import ModeToggle from "@/components/ModeToggle";
import { curveData, heroData, historyData, loadMarket } from "@/lib/market";

export default async function Home() {
  const market = await loadMarket();
  const hero = market ? heroData(market) : null;
  const history = market ? historyData(market) : null;
  const curve = market ? curveData(market) : null;

  return (
    <main className="bg-paper text-ink">
      <ModeToggle />
      <Hero data={hero} />
      {hero && <MeetDana today={hero.settle} asOf={hero.asOf} />}
      {history && <History data={history} />}
      {curve && <Curve data={curve} />}
      {hero && curve && <Swap curve={curve} today={hero.settle} />}
    </main>
  );
}
