import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music & Lyrics Manager",
  description: "Reproduce tu música y visualiza la letra en PDF, todo en un mismo lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
