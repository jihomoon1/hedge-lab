import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { copy, MODE_STORAGE_KEY } from "@/lib/copy";
import "./globals.css";

// The three typefaces from SPEC "Design": serif headings, sans numbers in
// Plain mode, monospace numbers in Desk mode.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// The site's public address: Vercel sets this for the live site; on your
// laptop it falls back to the local address. Link previews need full URLs.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: copy.meta.title,
  description: copy.meta.description,
  openGraph: {
    type: "website",
    siteName: copy.meta.name,
    title: copy.meta.title,
    description: copy.meta.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
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
