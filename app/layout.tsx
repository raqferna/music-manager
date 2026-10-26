import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { siteMode, siteSubtitle, siteTitle } from "@/lib/siteConfig";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: siteTitle(),
    description: siteSubtitle(),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-site={siteMode()} className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
