"use client";

import { Settings, Sun, Moon, Palette, Type } from "lucide-react";
import { useTheme } from "../providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "warm";
type FontFamily = "sans" | "serif" | "dyslexia" | "mono";

export function SettingsDropdown() {
  const { theme, setTheme, fontFamily, setFontFamily } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "warm", label: "Warm", icon: Palette },
  ] as const;

  const fonts = [
    { value: "sans", label: "Sans" },
    { value: "serif", label: "Serif" },
    { value: "mono", label: "Mono" },
    { value: "dyslexia", label: "Open Dyslexia" },
  ] as const;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="p-1.5 rounded-md"
          aria-label="Settings"
        >
          <Settings className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium">
            <Sun className="size-3.5" />
            Theme
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as Theme)}
          >
            {themes.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="flex items-center gap-2"
              >
                <Icon className="size-3.5" />
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium">
            <Type className="size-3.5" />
            Font Family
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={fontFamily}
            onValueChange={(value) => setFontFamily(value as FontFamily)}
          >
            {fonts.map(({ value, label }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className={
                  value === "dyslexia"
                    ? "font-dyslexia"
                    : value === "serif"
                    ? "font-serif"
                    : value === "mono"
                    ? "font-mono"
                    : "font-sans"
                }
              >
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
