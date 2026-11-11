import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { MODE_STORAGE_KEY } from "@/lib/copy";
import "./globals.css";

// The three typefaces from SPEC "Design": serif headings, sans numbers in
// Plain mode, monospace numbers in Desk mode.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hedge Lab",
  description:
    "Learn commodity derivatives by following one oil producer through her hedging decisions, priced off real market data.",
};

// Runs before the page is painted: if this browser last chose Desk Speak,
// switch the theme straight away so returning readers never see a flash of
// the paper theme first.
const restoreMode = `try{if(localStorage.getItem("${MODE_STORAGE_KEY}")==="desk")document.documentElement.dataset.mode="desk"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-mode="plain"
      // The script above may change data-mode before React loads; this tells
      // React that the difference is expected.
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <script dangerouslySetInnerHTML={{ __html: restoreMode }} />
        {children}
      </body>
    </html>
  );
}
