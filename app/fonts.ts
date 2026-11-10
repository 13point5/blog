import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Jersey_15,
  Newsreader,
  Pixelify_Sans,
  Press_Start_2P,
  Silkscreen,
  Space_Grotesk,
  VT323,
} from "next/font/google";

// Only the two defaults are preloaded; the rest download when picked.
const geist = Geist({ subsets: ["latin"], variable: "--f-geist" });
const pixelify = Pixelify_Sans({ subsets: ["latin"], variable: "--f-pixelify" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--f-mono", preload: false });
const pressStart = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--f-press-start", preload: false });
const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--f-vt323", preload: false });
const silkscreen = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-silkscreen", preload: false });
const jersey = Jersey_15({ subsets: ["latin"], weight: "400", variable: "--f-jersey", preload: false });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--f-grotesk", preload: false });
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--f-newsreader", preload: false });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--f-instrument", preload: false });

export const fontVariables = [
  geist, pixelify, mono, pressStart, vt323, silkscreen, jersey, grotesk, newsreader, instrument,
]
  .map((f) => f.variable)
  .join(" ");
