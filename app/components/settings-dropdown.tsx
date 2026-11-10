"use client";

import { useTheme } from "../providers/theme-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FONTS, PRESETS, getFont } from "@/lib/fonts-config";
import { PixelIcon } from "./pixel-icon";

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const i = Math.max(0, FONTS.findIndex((f) => f.id === value));
  const step = (d: number) => onChange(FONTS[(i + d + FONTS.length) % FONTS.length].id);
  const font = FONTS[i];
  return (
    <div className="flex items-center gap-2">
      <span className="d-xs uppercase text-foreground-muted w-16 shrink-0">{label}</span>
      <button type="button" className="px-btn !px-2 !py-0.5 !shadow-none" onClick={() => step(-1)} aria-label={`Previous ${label} font`}>◀</button>
      <span
        className="flex-1 text-center truncate"
        style={{ fontFamily: font.css, fontSize: `${0.95 * font.bs}rem` }}
        aria-live="polite"
      >
        {font.label}
      </span>
      <button type="button" className="px-btn !px-2 !py-0.5 !shadow-none" onClick={() => step(1)} aria-label={`Next ${label} font`}>▶</button>
    </div>
  );
}

export function SettingsDropdown() {
  const { theme, setTheme, display, body, setFonts, motion, setMotion } = useTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="px-btn !py-1 !px-2.5 !shadow-none" aria-label="Open settings menu">
          menu
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="px-window w-[min(calc(100vw-1.5rem),22rem)] p-0 text-foreground rounded-none"
      >
        <div className="px-titlebar">
          <span className="flex-1">settings.cfg</span>
        </div>

        <div className="p-3 flex flex-col gap-4">
          <section aria-label="Theme" className="grid grid-cols-2 gap-2">
            <button type="button" className="px-btn" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
              <PixelIcon name="sun" size={2} /> day
            </button>
            <button type="button" className="px-btn" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
              <PixelIcon name="moon" size={2} /> night
            </button>
          </section>

          <section aria-label="Font presets">
            <h3 className="d-xs uppercase text-foreground-muted mb-2">Font presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => {
                const d = getFont(p.display);
                const b = getFont(p.body);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="px-btn !flex-col !items-start !gap-0 !px-2 !py-1.5 text-left !shadow-none min-w-0"
                    aria-pressed={display === p.display && body === p.body}
                    onClick={() => setFonts(p.display, p.body)}
                  >
                    <span className="truncate max-w-full" style={{ fontFamily: d.css, fontSize: `${1.05 * d.ds}rem`, lineHeight: 1.3 }}>
                      {p.label}
                    </span>
                    <span className="truncate max-w-full opacity-75" style={{ fontFamily: b.css, fontSize: `${0.72 * b.bs}rem`, lineHeight: 1.4 }}>
                      {p.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-label="Mix your own fonts" className="flex flex-col gap-2">
            <h3 className="d-xs uppercase text-foreground-muted">Mix your own</h3>
            <Stepper label="Titles" value={display} onChange={(id) => setFonts(id, body)} />
            <Stepper label="Text" value={body} onChange={(id) => setFonts(display, id)} />
          </section>

          <section aria-label="Animation" className="flex items-center gap-2">
            <span className="d-xs uppercase text-foreground-muted w-16 shrink-0">Motion</span>
            <button type="button" className="px-btn !py-0.5 !shadow-none flex-1" aria-pressed={motion} onClick={() => setMotion(true)}>on</button>
            <button type="button" className="px-btn !py-0.5 !shadow-none flex-1" aria-pressed={!motion} onClick={() => setMotion(false)}>off</button>
          </section>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
