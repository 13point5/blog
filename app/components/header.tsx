"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsDropdown } from "./settings-dropdown";
import { PixelIcon } from "./pixel-icon";
import { cn } from "@/lib/utils";

export function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const isOnBlogPage = pathname.startsWith("/blog");

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      // Show when scrolling up or near the top; hide when scrolling down
      if (y < lastScrollY.current || y < 10) setIsVisible(true);
      else if (y > lastScrollY.current && y > 60) setIsVisible(false);
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-13 bg-background-card border-b-[3px] border-frame transition-transform duration-200",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 d-md">
          <Link href="/" className="flex items-center gap-2 shrink-0 hover:text-koi" aria-label="sriraam — home">
            <PixelIcon name="koi" size={3} className="px-bob" />
            <span>sriraam</span>
          </Link>
          {isOnBlogPage && (
            <>
              <span className="text-foreground-muted" aria-hidden="true">/</span>
              <Link href="/blog" className="hover:text-koi">blog</Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 sm:gap-5 d-sm">
          {!isOnBlogPage && (
            <Link href="/blog" className="hover:text-koi">blog</Link>
          )}
          <SettingsDropdown />
        </div>
      </nav>
    </header>
  );
}
