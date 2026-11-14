// Single source of truth for the font choices in the menu.
// `ds` / `bs` are optical scales so every face sits at a similar visual size.

export type FontOption = {
  id: string;
  /** CSS font-family value */
  css: string;
  /** scale when used for headings */
  ds: number;
  /** weight when used for headings */
  dw: number;
  /** scale when used for body text */
  bs: number;
};

export const FONTS: FontOption[] = [
  { id: "instrument", css: "var(--f-instrument), Georgia, serif", ds: 1.22, dw: 400, bs: 1.15 },
  { id: "newsreader", css: "var(--f-newsreader), Georgia, serif", ds: 1.08, dw: 400, bs: 1.1 },
  { id: "geist", css: "var(--f-geist), system-ui, sans-serif", ds: 1, dw: 600, bs: 1 },
  { id: "pixelify", css: "var(--f-pixelify), system-ui, sans-serif", ds: 1, dw: 500, bs: 1.05 },
  { id: "dyslexic", css: '"OpenDyslexic", sans-serif', ds: 0.86, dw: 700, bs: 0.94 },
];

export type FontPreset = { id: string; label: string; display: string; body: string };

export const PRESETS: FontPreset[] = [
  { id: "classic", label: "Serif + sans", display: "newsreader", body: "geist" },
  { id: "display", label: "Display serif + sans", display: "instrument", body: "geist" },
  { id: "serif", label: "All serif", display: "newsreader", body: "newsreader" },
  { id: "sans", label: "All sans", display: "geist", body: "geist" },
  { id: "pixel", label: "Pixel + sans", display: "pixelify", body: "geist" },
  { id: "dyslexic", label: "OpenDyslexic", display: "dyslexic", body: "dyslexic" },
];

export const DEFAULT_DISPLAY = PRESETS[0].display;
export const DEFAULT_BODY = PRESETS[0].body;

export function getFont(id: string) {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

/** CSS that maps <html data-display data-body> onto the type variables. */
export function fontCss() {
  return FONTS.map(
    (f) =>
      `html[data-display="${f.id}"]{--ff-display:${f.css};--ds:${f.ds};--dw:${f.dw}}` +
      `html[data-body="${f.id}"]{--ff-body:${f.css};--bs:${f.bs}}`
  ).join("");
}

/** Runs before first paint so there's no flash of the wrong theme or font. */
export function bootScript() {
  const ids = JSON.stringify(FONTS.map((f) => f.id));
  return `(function(){try{var d=document.documentElement,l=localStorage,ids=${ids};
if(l.getItem('theme')==='dark')d.classList.add('dark');
var a=l.getItem('fontDisplay'),b=l.getItem('fontBody');
d.dataset.display=ids.indexOf(a)>-1?a:'${DEFAULT_DISPLAY}';
d.dataset.body=ids.indexOf(b)>-1?b:'${DEFAULT_BODY}';}catch(e){}})();`;
}
