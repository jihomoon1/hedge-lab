// The one long page. Chapters get added here in order; so far only the Hero.

import Hero from "@/components/chapters/Hero";
import { heroData, loadMarket } from "@/lib/market";

export default async function Home() {
  const market = await loadMarket();

  return (
    // data-mode picks the theme. Phase 3's ModeToggle will switch it to "desk".
    <main data-mode="plain" className="bg-paper text-ink">
      <Hero data={market ? heroData(market) : null} mode="plain" />
    </main>
  );
}
