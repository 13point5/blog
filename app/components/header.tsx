"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/theme-provider";

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  return (
    <header className="studio-header">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <nav className="studio-width" aria-label="Main navigation">
        <Link href="/" className="wordmark" aria-label="Sriraam home">sriraam<span className="brand-dot">✳</span></Link>
        <div className="header-right"><Link className="writing-link" href="/blog" aria-current={pathname.startsWith('/blog') ? 'page' : undefined}>Writing <span>↗</span></Link><span className="nav-divider" />
          <button className="theme-switch" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle light and dark theme"><Sun className="sun-icon" size={18} /><Moon className="moon-icon" size={18} /></button>
        </div>
      </nav>
    </header>
  );
}
