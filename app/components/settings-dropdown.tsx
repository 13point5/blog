"use client";

import { Sun, Moon, Type } from "lucide-react";
import { useTheme } from "../providers/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Settings as a little tape-deck panel of tactile keys. */
export function SettingsDropdown() {
  const { theme, setTheme, fontFamily, setFontFamily } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ] as const;

  const fonts = [
    { value: "sans", label: "Default type", glyph: <Type /> },
    {
      value: "dyslexia",
      label: "Open Dyslexic",
      glyph: <span className="font-dyslexia-glyph text-[11px] font-bold">OD</span>,
    },
  ] as const;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="key" aria-label="Menu">
          menu
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-0 w-auto p-3 rounded-xl border border-border bg-background-card text-foreground shadow-[0_18px_40px_-18px_var(--shadow-ink)]"
        align="end"
        sideOffset={10}
      >
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="kicker text-[10px]!">theme</span>
            <div className="flex gap-2 pb-1">
              {themes.map(({ value, label, icon: Icon }) => (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="key px-0!"
                      aria-label={label}
                      aria-pressed={theme === value}
                      onClick={() => setTheme(value)}
                    >
                      <Icon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="h-12 w-px bg-border" aria-hidden="true" />

          <div className="flex flex-col gap-2">
            <span className="kicker text-[10px]!">type</span>
            <div className="flex gap-2 pb-1">
              {fonts.map(({ value, label, glyph }) => (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="key px-0!"
                      aria-label={label}
                      aria-pressed={fontFamily === value}
                      onClick={() => setFontFamily(value)}
                    >
                      {glyph}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
