"use client";

import Image from "next/image";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/theme-provider";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="collection-header">
      <a href="#main-content" className="skip-link">Skip to collection</a>
      <Link href="/" className="identity" aria-label="Sriraam’s collection">
        <Image src="/avatar.jpeg" alt="" width={38} height={38} priority />
        <span>sriraam<span className="identity-note">learning & making</span></span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/about" className="about-trigger">about</Link>
        <button className="theme-switch" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle light and dark theme">
          <Sun className="sun-icon" size={16} /><Moon className="moon-icon" size={16} />
        </button>
      </nav>
    </header>
  );
}
