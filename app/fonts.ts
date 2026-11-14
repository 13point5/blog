import { Geist, Geist_Mono, Instrument_Serif, Newsreader, Pixelify_Sans } from "next/font/google";

// Only the two defaults are preloaded; the rest download when picked.
const geist = Geist({ subsets: ["latin"], variable: "--f-geist" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--f-instrument", preload: false });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--f-mono", preload: false });
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--f-newsreader" });
const pixelify = Pixelify_Sans({ subsets: ["latin"], variable: "--f-pixelify", preload: false });

export const fontVariables = [geist, instrument, mono, newsreader, pixelify].map((f) => f.variable).join(" ");
