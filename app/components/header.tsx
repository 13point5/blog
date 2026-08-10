"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
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
        "fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--parchment)]/85 backdrop-blur-md border-b border-[var(--ink)]/10 transition-transform duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav className="max-w-3xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm tracking-wide">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 font-[family-name:var(--font-display)] text-lg tracking-[0.06em] hover:opacity-70 transition-opacity",
              isOnBlogPage && "text-[var(--ink-muted)]"
            )}
          >
            <Image
              src="/images/vintage/stamp-llm-automaton.webp"
              alt=""
              width={22}
              height={22}
              className="rounded-[2px] border border-[var(--ink)]/20"
            />
            <span>sriraam</span>
          </Link>
          {isOnBlogPage && (
            <>
              <span className="text-[var(--ink-muted)]">/</span>
              <Link
                href="/blog"
                className={cn(
                  "font-[family-name:var(--font-display)] hover:opacity-70 transition-opacity",
                  blogSlug && "text-[var(--ink-muted)]"
                )}
              >
                letters
              </Link>
            </>
          )}
          {blogSlug && (
            <>
              <span className="text-[var(--ink-muted)]">/</span>
              <span className="truncate max-w-[40vw] sm:max-w-56 font-[family-name:var(--font-display)] italic text-[var(--ink-muted)]">
                {blogSlug}
              </span>
            </>
          )}
        </div>
        <SettingsDropdown />
      </nav>
    </header>
  );
}
