"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/theme-provider";
export function SettingsDropdown() {
  const { theme, setTheme } = useTheme();
  return <button type="button" className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={theme === "dark" ? "Let there be light · Lumos" : "A little night reading · Nox"}>
    <Sun className="sun-icon" size={17} aria-hidden="true" /><Moon className="moon-icon" size={17} aria-hidden="true" />
  </button>;
}
