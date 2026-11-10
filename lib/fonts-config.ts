// Single source of truth for the font picker in the menu.
// `ds` / `bs` are optical scales: pixel fonts vary wildly in apparent size,
// so each one is nudged to sit at roughly the same visual weight.

export type FontKind = "pixel" | "sans" | "serif" | "mono";

export type FontOption = {
  id: string;
  label: string;
  kind: FontKind;
  /** CSS font-family value */
  css: string;
  /** scale when used for headings */
  ds: number;
  /** scale when used for body text */
  bs: number;
  /** body line-height */
  lh: number;
};

export const FONTS: FontOption[] = [
  { id: "pixelify", label: "Pixelify Sans", kind: "pixel", css: "var(--f-pixelify), system-ui, sans-serif", ds: 1, bs: 1.06, lh: 1.65 },
  { id: "press-start", label: "Press Start 2P", kind: "pixel", css: "var(--f-press-start), monospace", ds: 0.6, bs: 0.66, lh: 2.1 },
  { id: "vt323", label: "VT323", kind: "pixel", css: "var(--f-vt323), monospace", ds: 1.3, bs: 1.32, lh: 1.35 },
  { id: "silkscreen", label: "Silkscreen", kind: "pixel", css: "var(--f-silkscreen), monospace", ds: 0.8, bs: 0.84, lh: 1.8 },
  { id: "jersey", label: "Jersey 15", kind: "pixel", css: "var(--f-jersey), system-ui, sans-serif", ds: 1.32, bs: 1.34, lh: 1.35 },
  { id: "geist", label: "Geist", kind: "sans", css: "var(--f-geist), system-ui, sans-serif", ds: 1, bs: 1, lh: 1.7 },
  { id: "grotesk", label: "Space Grotesk", kind: "sans", css: "var(--f-grotesk), system-ui, sans-serif", ds: 1, bs: 1, lh: 1.7 },
  { id: "newsreader", label: "Newsreader", kind: "serif", css: "var(--f-newsreader), Georgia, serif", ds: 1.1, bs: 1.12, lh: 1.65 },
  { id: "instrument", label: "Instrument Serif", kind: "serif", css: "var(--f-instrument), Georgia, serif", ds: 1.25, bs: 1.2, lh: 1.55 },
  { id: "mono", label: "Geist Mono", kind: "mono", css: "var(--f-mono), ui-monospace, monospace", ds: 0.92, bs: 0.94, lh: 1.75 },
  { id: "dyslexic", label: "OpenDyslexic", kind: "sans", css: '"OpenDyslexic", sans-serif', ds: 0.86, bs: 0.94, lh: 1.8 },
];

export type FontPreset = {
  id: string;
  label: string;
  note: string;
  display: string;
  body: string;
};

export const PRESETS: FontPreset[] = [
  { id: "cozy", label: "Cozy", note: "pixel + sans", display: "pixelify", body: "geist" },
  { id: "arcade", label: "Arcade", note: "all pixel", display: "press-start", body: "pixelify" },
  { id: "terminal", label: "Terminal", note: "all pixel", display: "vt323", body: "vt323" },
  { id: "8bit", label: "8-bit", note: "pixel + mono", display: "silkscreen", body: "mono" },
  { id: "storybook", label: "Storybook", note: "pixel + serif", display: "jersey", body: "newsreader" },
  { id: "pixelify", label: "Soft pixel", note: "all pixel", display: "pixelify", body: "pixelify" },
  { id: "editorial", label: "Editorial", note: "serif", display: "instrument", body: "newsreader" },
  { id: "magazine", label: "Magazine", note: "serif + sans", display: "instrument", body: "geist" },
  { id: "clean", label: "Clean", note: "sans", display: "grotesk", body: "geist" },
  { id: "dyslexic", label: "Dyslexic", note: "accessible", display: "dyslexic", body: "dyslexic" },
];

export const DEFAULT_DISPLAY = "pixelify";
export const DEFAULT_BODY = "geist";

export function getFont(id: string) {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

/** CSS that maps <html data-display data-body> onto the type variables. */
export function fontCss() {
  return FONTS.map(
    (f) =>
      `html[data-display="${f.id}"]{--ff-display:${f.css};--ds:${f.ds}}` +
      `html[data-body="${f.id}"]{--ff-body:${f.css};--bs:${f.bs};--lh:${f.lh}}`
  ).join("");
}

/** Runs before first paint so there's no flash of the wrong theme or font. */
export function bootScript() {
  const ids = JSON.stringify(FONTS.map((f) => f.id));
  return `(function(){try{var d=document.documentElement,l=localStorage,ids=${ids};
if(l.getItem('theme')==='dark')d.classList.add('dark');
var a=l.getItem('fontDisplay'),b=l.getItem('fontBody');
d.dataset.display=ids.indexOf(a)>-1?a:'${DEFAULT_DISPLAY}';
d.dataset.body=ids.indexOf(b)>-1?b:'${DEFAULT_BODY}';
if(l.getItem('motion')==='off')d.dataset.motion='off';}catch(e){}})();`;
}
