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
  const blogSlug = pathname.startsWith("/blog/")
    ? pathname.split("/")[2]
    : null;

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
        "fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xs transition-transform duration-300",
        isOnBlogPage ? "py-2.5 sm:py-3" : "h-12 sm:h-14",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav
        className={cn(
          "max-w-5xl mx-auto px-6 flex items-center justify-between gap-4",
          !isOnBlogPage && "h-full"
        )}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <Link
            href="/"
            className="text-base sm:text-lg font-bold tracking-tight hover:text-foreground-muted transition-colors w-fit"
          >
            sriraam
          </Link>
          {isOnBlogPage && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-foreground-muted tracking-tight min-w-0">
              <Link
                href="/blog"
                className={cn(
                  "hover:text-foreground transition-colors shrink-0",
                  !blogSlug && "text-foreground"
                )}
              >
                blog
              </Link>
              {blogSlug && (
                <>
                  <span aria-hidden="true">/</span>
                  <span className="truncate max-w-[45vw] sm:max-w-64">
                    {blogSlug}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <SettingsDropdown />
      </nav>
    </header>
  );
}
