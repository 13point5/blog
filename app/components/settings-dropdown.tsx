"use client";

import { useTheme } from "../providers/theme-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PRESETS, getFont } from "@/lib/fonts-config";
import { cn } from "@/lib/utils";

const row =
  "flex w-full items-center justify-between gap-6 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent outline-none focus-visible:bg-accent cursor-pointer";

export function SettingsDropdown() {
  const { theme, setTheme, display, body, setFonts, artWidth, artStyle, homeArt, setArt } = useTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="font-display d-md text-foreground-muted hover:text-foreground transition-colors outline-none focus-visible:text-foreground cursor-pointer"
          aria-label="Open settings menu"
        >
          menu
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-52 p-1.5 bg-background-card text-foreground max-h-[calc(100dvh-5rem)] overflow-y-auto">
        <p className="px-2 pt-1 pb-1 text-xs text-foreground-muted">Theme</p>
        {(["light", "dark"] as const).map((t) => (
          <button key={t} type="button" className={row} aria-pressed={theme === t} onClick={() => setTheme(t)}>
            <span className="capitalize">{t}</span>
            {theme === t && <span aria-hidden="true" className="size-1.5 bg-koi" />}
          </button>
        ))}

        <div className="my-1.5 h-px bg-border" aria-hidden="true" />

        <p className="px-2 pt-1 pb-1 text-xs text-foreground-muted">Type</p>
        {PRESETS.map((p) => {
          const active = display === p.display && body === p.body;
          const font = getFont(p.display);
          return (
            <button key={p.id} type="button" className={row} aria-pressed={active} onClick={() => setFonts(p.display, p.body)}>
              <span className={cn("truncate")} style={{ fontFamily: font.css, fontSize: `${0.9 * font.ds}rem`, lineHeight: 1.3 }}>
                {p.label}
              </span>
              {active && <span aria-hidden="true" className="size-1.5 bg-koi shrink-0" />}
            </button>
          );
        })}

        <div className="my-1.5 h-px bg-border" aria-hidden="true" />

        <p className="px-2 pt-1 pb-1 text-xs text-foreground-muted">Playfulness</p>
        {([["scatter", "Toys everywhere"], ["shelf", "Shelf of things"], ["castle", "Castle"], ["pond", "Koi pond"]] as const).map(([v, label]) => (
          <button key={v} type="button" className={row} aria-pressed={homeArt === v} onClick={() => setArt(artWidth, artStyle, v)}>
            <span>{label}</span>
            {homeArt === v && <span aria-hidden="true" className="size-1.5 bg-koi" />}
          </button>
        ))}
        <p className="px-2 pt-2 pb-1 text-xs text-foreground-muted">Art style</p>
        {([["color", "Full colour"], ["ink", "Ink"]] as const).map(([v, label]) => (
          <button key={v} type="button" className={row} aria-pressed={artStyle === v} onClick={() => setArt(artWidth, v, homeArt)}>
            <span>{label}</span>
            {artStyle === v && <span aria-hidden="true" className="size-1.5 bg-koi" />}
          </button>
        ))}
        <p className="px-2 pt-2 pb-1 text-xs text-foreground-muted">Art width</p>
        {([["full", "Full screen"], ["column", "Text column"]] as const).map(([v, label]) => (
          <button key={v} type="button" className={row} aria-pressed={artWidth === v} onClick={() => setArt(v, artStyle, homeArt)}>
            <span>{label}</span>
            {artWidth === v && <span aria-hidden="true" className="size-1.5 bg-koi" />}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
