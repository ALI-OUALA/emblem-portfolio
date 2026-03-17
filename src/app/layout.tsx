import type { Metadata } from "next";
import "./globals.css";
import { bodyFont, displayFont, monoFont } from "./fonts";

export const metadata: Metadata = {
  title: "EMBLÉM — Portfolio & Studio",
  description:
    "EMBLÉM is a boutique studio crafting minimal, high-impact digital experiences and brand systems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
