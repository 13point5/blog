"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark" | "warm";
type FontFamily = "sans" | "serif" | "dyslexia" | "mono";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("theme") as Theme) || "light";
}

function getStoredFont(): FontFamily {
  if (typeof window === "undefined") return "sans";
  return (localStorage.getItem("fontFamily") as FontFamily) || "sans";
}

// Custom hook for hydration-safe mounting
function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hasMounted = useHasMounted();
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() =>
    getStoredFont()
  );

  // Apply theme class
  useEffect(() => {
    if (!hasMounted) return;

    const root = document.documentElement;
    root.classList.remove("dark", "warm");

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "warm") {
      root.classList.add("warm");
    }

    localStorage.setItem("theme", theme);
  }, [theme, hasMounted]);

  // Apply font class
  useEffect(() => {
    if (!hasMounted) return;

    const root = document.documentElement;
    root.classList.remove(
      "font-sans",
      "font-serif",
      "font-dyslexia",
      "font-mono"
    );
    root.classList.add(`font-${fontFamily}`);

    localStorage.setItem("fontFamily", fontFamily);
  }, [fontFamily, hasMounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setFontFamily = (newFont: FontFamily) => {
    setFontFamilyState(newFont);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, fontFamily, setFontFamily }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
