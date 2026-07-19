import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DynamicBackground } from "@/components/DynamicBackground";

/* Archivo variable — width axis carries the display voice (stretched
   grotesk headlines) while the normal width does quiet UI duty. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

/* IBM Plex Mono — instrument-panel numerals, addresses, labels. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Betr",
  description:
    "Stake a bet with anyone. The winner gets paid automatically onchain. No arguing, no chasing. Built on Monad.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <DynamicBackground />
        <Providers>
          <TopNav />
          <main className="mx-auto w-full max-w-[1160px] flex-1 px-5 py-8">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
