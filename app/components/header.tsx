"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsDropdown } from "./settings-dropdown";
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
        "fixed top-0 left-0 right-0 z-50 h-14 bg-background/70 backdrop-blur-sm transition-transform duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav className="max-w-2xl mx-auto px-5 h-full flex items-center justify-between gap-4">
        <Link href="/" className="font-display d-md hover:text-foreground-muted transition-colors">
          Sriraam
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link
            href="/blog"
            className={cn(
              "hover:text-foreground transition-colors",
              isOnBlogPage ? "text-foreground" : "text-foreground-muted"
            )}
          >
            blog
          </Link>
          <SettingsDropdown />
        </div>
      </nav>
    </header>
  );
}
