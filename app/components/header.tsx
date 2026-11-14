"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Reactor, Sprite } from "./toys";
import { pageFlip } from "@/lib/audio";
import { cn } from "@/lib/utils";

export function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [bookTaps, setBookTaps] = useState(0);
  const router = useRouter();
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

  // Tapping the book lets its cover swing open before the blog appears. Inside
  // the blog it already lies open, so the tap just goes to the index.
  const openBook = (e: React.MouseEvent) => {
    pageFlip();
    const plain = !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isOnBlogPage || !plain || still) return;
    e.preventDefault();
    setBookTaps((n) => n + 1);
    setTimeout(() => router.push("/blog"), 380);
  };

  return (
    <header
      // the owl reads this to know whether the header is covering the top of the page
      data-hidden={!isVisible}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-[72px] px-header bg-background transition-transform duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav className="max-w-2xl mx-auto px-5 h-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="font-display text-[calc(1.6rem*var(--ds))] leading-none hover:text-foreground-muted transition-colors">
            Sriraam
          </Link>
          {/* the owl's home: it waits here, beside the name, when no heading is on screen */}
          <span data-owl-home="" aria-hidden="true" className="w-[46px] h-[46px] shrink-0" />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/blog" aria-label="Blog" title="Blog" onClick={openBook} className="flex items-center hover:opacity-80 transition-opacity">
            <Sprite id="book" scale={2} rows={30} active={isOnBlogPage} taps={bookTaps} />
          </Link>
          {/*
            The settings menu (theme, type, playfulness, art style and width) is
            hidden from the header for now. To bring it back during development,
            render it here:

              <SettingsDropdown />

            and import it: import { SettingsDropdown } from "./settings-dropdown";
            The component itself is untouched in settings-dropdown.tsx.
          */}
          <Reactor />
        </div>
      </nav>
    </header>
  );
}
