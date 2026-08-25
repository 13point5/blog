"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";
type FontFamily = "sans" | "dyslexia";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark") return "dark";
  return "light";
}

function getStoredFont(): FontFamily {
  if (typeof window === "undefined") return "sans";
  const stored = localStorage.getItem("fontFamily");
  if (stored === "dyslexia") return "dyslexia";
  return "sans";
}

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

  useEffect(() => {
    if (!hasMounted) return;

    const root = document.documentElement;
    root.classList.remove("dark", "warm");

    if (theme === "dark") {
      root.classList.add("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;

    const root = document.documentElement;
    root.classList.remove("font-sans", "font-dyslexia");
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
