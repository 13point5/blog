"use client";

import { Sun, Moon, Palette, Type, BookOpen } from "lucide-react";
import { useTheme } from "../providers/theme-provider";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "warm";
type FontFamily = "sans" | "dyslexia";

export function SettingsDropdown() {
  const { theme, setTheme, fontFamily, setFontFamily } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "warm", label: "Warm", icon: Palette },
  ] as const;

  const fonts = [
    { value: "sans", label: "Sans", icon: Type },
    { value: "dyslexia", label: "Open Dyslexia", icon: BookOpen },
  ] as const;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="text-sm font-normal tracking-[0.14em] uppercase hover:text-foreground-muted transition-colors outline-none focus-visible:text-foreground-muted cursor-pointer"
          aria-label="Menu"
        >
          MENU
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="flex items-center gap-1 p-1.5 min-w-0 w-auto"
        align="end"
        sideOffset={8}
      >
        {themes.map(({ value, label, icon: Icon }) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                aria-pressed={theme === value}
                onClick={() => setTheme(value as Theme)}
                className={cn(
                  "rounded-md",
                  theme === value && "bg-accent text-foreground"
                )}
              >
                <Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}

        <div className="mx-0.5 h-5 w-px bg-border/60" aria-hidden="true" />

        {fonts.map(({ value, label, icon: Icon }) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                aria-pressed={fontFamily === value}
                onClick={() => setFontFamily(value as FontFamily)}
                className={cn(
                  "rounded-md",
                  fontFamily === value && "bg-accent text-foreground",
                  value === "dyslexia" && "font-dyslexia"
                )}
              >
                <Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
