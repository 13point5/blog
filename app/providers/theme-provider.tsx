"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_BODY, DEFAULT_DISPLAY, FONTS } from "@/lib/fonts-config";

type Theme = "light" | "dark";
export type ArtWidth = "column" | "full";
export type ArtEdge = "hard" | "dissolve";

interface Settings {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** heading font id */
  display: string;
  /** body font id */
  body: string;
  setFonts: (display: string, body: string) => void;
  /** How wide pixel art is drawn. */
  artWidth: ArtWidth;
  /** Whether its edges are crisp or crumble into the page. */
  artEdge: ArtEdge;
  setArt: (width: ArtWidth, edge: ArtEdge) => void;
}

const ThemeContext = createContext<Settings | undefined>(undefined);

const isFont = (id: string | null): id is string => FONTS.some((f) => f.id === id);

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start from the defaults so the server and first client render agree; the
  // inline boot script has already applied the stored values to <html>.
  const [theme, setThemeState] = useState<Theme>("light");
  const [display, setDisplay] = useState(DEFAULT_DISPLAY);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [artWidth, setArtWidth] = useState<ArtWidth>("full");
  const [artEdge, setArtEdge] = useState<ArtEdge>("dissolve");

  useEffect(() => {
    const d = read("fontDisplay");
    const b = read("fontBody");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage after hydration
    setThemeState(read("theme") === "dark" ? "dark" : "light");
    if (isFont(d)) setDisplay(d);
    if (isFont(b)) setBody(b);
    if (read("artWidth") === "column") setArtWidth("column");
    if (read("artEdge") === "hard") setArtEdge("hard");
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    write("theme", next);
  };

  const setFonts = (nextDisplay: string, nextBody: string) => {
    setDisplay(nextDisplay);
    setBody(nextBody);
    document.documentElement.dataset.display = nextDisplay;
    document.documentElement.dataset.body = nextBody;
    write("fontDisplay", nextDisplay);
    write("fontBody", nextBody);
  };

  const setArt = (width: ArtWidth, edge: ArtEdge) => {
    setArtWidth(width);
    setArtEdge(edge);
    write("artWidth", width);
    write("artEdge", edge);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, display, body, setFonts, artWidth, artEdge, setArt }}>
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
