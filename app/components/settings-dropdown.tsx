"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Sun, Moon, Palette, Type, Check } from "lucide-react";
import { useTheme } from "../providers/theme-provider";

export function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme, fontFamily, setFontFamily } = useTheme();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "warm", label: "Warm", icon: Palette },
  ] as const;

  const fonts = [
    { value: "sans", label: "Sans" },
    { value: "serif", label: "Serif" },
    { value: "dyslexia", label: "Dyslexia" },
  ] as const;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="Settings"
      >
        <Settings className="size-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-background-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {/* Theme Section */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground-muted mb-2">
              <Sun className="size-3.5" />
              Theme
            </div>
            <div className="flex gap-1">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    theme === value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Section */}
          <div className="p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground-muted mb-2">
              <Type className="size-3.5" />
              Font Family
            </div>
            <div className="space-y-1">
              {fonts.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFontFamily(value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    fontFamily === value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  <span
                    className={
                      value === "dyslexia"
                        ? "font-dyslexia"
                        : value === "serif"
                          ? "font-serif"
                          : "font-sans"
                    }
                  >
                    {label}
                  </span>
                  {fontFamily === value && <Check className="size-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
