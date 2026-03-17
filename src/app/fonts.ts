import { IBM_Plex_Mono, Instrument_Sans, Instrument_Serif } from "next/font/google";

export const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const displayFont = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-display",
});

export const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-mono",
});
