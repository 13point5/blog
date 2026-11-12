"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprite, Wand } from "./toys";
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
        "fixed top-0 left-0 right-0 z-50 h-[72px] px-header bg-background transition-transform duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav className="max-w-2xl mx-auto px-5 h-full flex items-center justify-between gap-4">
        <Link href="/" className="font-display d-md leading-none hover:text-foreground-muted transition-colors">
          Sriraam
        </Link>
        <div className="flex items-center gap-4">
          {/* where the owl waits when no heading on screen has room for it */}
          <span data-owl-home="" aria-hidden="true" className="w-12 h-12" />
          <Link href="/blog" aria-label="Blog" title="Blog" className="relative flex items-center hover:opacity-70 transition-opacity">
            <Sprite id="book" scale={2} rows={21} />
            {isOnBlogPage && <span aria-hidden="true" className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 size-1 bg-koi" />}
          </Link>
          {/*
            The settings menu (theme, type, playfulness, art style and width) is
            hidden from the header for now. To bring it back during development,
            render it here:

              <SettingsDropdown />

            and import it: import { SettingsDropdown } from "./settings-dropdown";
            The component itself is untouched in settings-dropdown.tsx.
          */}
          <Wand />
        </div>
      </nav>
    </header>
  );
}
