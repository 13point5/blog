"use client";
import { useTheme } from "../providers/theme-provider";

export function SettingsDropdown() {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
    >
      <span className="theme-mark" aria-hidden="true" />
    </button>
  );
}
