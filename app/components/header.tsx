"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsDropdown } from "./settings-dropdown";
import { cn } from "@/lib/utils";

export function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const isOnBlogPage = pathname.startsWith("/blog");

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
        "fixed top-0 left-0 right-0 z-50 h-12 sm:h-14 bg-background/80 backdrop-blur-xs transition-transform duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 min-w-0 text-base sm:text-lg tracking-tight">
          <Link
            href="/"
            className={cn(
              "font-bold hover:text-foreground-muted transition-colors shrink-0",
              isOnBlogPage && "text-foreground-muted"
            )}
          >
            sriraam
          </Link>
          {isOnBlogPage && (
            <>
              <span className="text-foreground-muted" aria-hidden="true">
                /
              </span>
              <Link
                href="/blog"
                className="font-normal hover:text-foreground-muted transition-colors"
              >
                blog
              </Link>
            </>
          )}
        </div>
        <SettingsDropdown />
      </nav>
    </header>
  );
}
