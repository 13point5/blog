"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SettingsDropdown } from "./settings-dropdown";
import { cn } from "@/lib/utils";

export function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // Hide header when scrolling down (after 60px)
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-12 bg-background/80 backdrop-blur-xs border-b border-border/30 transition-transform duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium tracking-tight hover:text-foreground-muted transition-colors"
        >
          <Image
            src="/zoro.png"
            alt="Zoro"
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="sm:hidden">13.5</span>
          <span className="hidden sm:inline">13point5</span>
        </Link>
        <SettingsDropdown />
      </nav>
    </header>
  );
}
