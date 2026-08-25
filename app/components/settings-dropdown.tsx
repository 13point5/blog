"use client";

import { Sun, Moon, Type } from "lucide-react";
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

export function SettingsDropdown() {
  const { theme, setTheme, fontFamily, setFontFamily } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
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
                onClick={() => setTheme(value)}
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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Sans"
              aria-pressed={fontFamily === "sans"}
              onClick={() => setFontFamily("sans")}
              className={cn(
                "rounded-md",
                fontFamily === "sans" && "bg-accent text-foreground"
              )}
            >
              <Type className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Sans</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Open Dyslexia"
              aria-pressed={fontFamily === "dyslexia"}
              onClick={() => setFontFamily("dyslexia")}
              className={cn(
                "rounded-md font-dyslexia text-xs font-bold tracking-tight",
                fontFamily === "dyslexia" && "bg-accent text-foreground"
              )}
            >
              OD
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open Dyslexia</TooltipContent>
        </Tooltip>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
