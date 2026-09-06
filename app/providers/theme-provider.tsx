"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | undefined>(undefined);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
    const sync = (event: StorageEvent) => {
      if (event.key === "theme") {
        const next = event.newValue === "dark" ? "dark" : "light";
        document.documentElement.classList.toggle("dark", next === "dark");
        setThemeState(next);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function setTheme(next: Theme) {
    document.documentElement.classList.toggle("dark", next === "dark");
    setThemeState(next);
    try { localStorage.setItem("theme", next); } catch { /* Mode works without storage. */ }
  }
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
