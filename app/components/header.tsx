"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsDropdown } from "./settings-dropdown";
import { cn } from "@/lib/utils";

export function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
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

      setIsScrolled(currentScrollY > 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 transition-[translate,background-color,box-shadow] duration-300",
        isScrolled
          ? "bg-background/85 backdrop-blur-sm shadow-[0_1px_0_var(--border)]"
          : "bg-transparent",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 text-lg tracking-tight">
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 rounded-full"
            aria-label="sriraam, home"
          >
            <Image
              src="/avatar-face.png"
              alt=""
              width={34}
              height={34}
              className="sticker size-[34px]"
              priority
            />
            <span
              className={cn(
                "font-display text-lg lowercase transition-colors",
                isOnBlogPage && "text-foreground-muted"
              )}
            >
              sriraam
            </span>
          </Link>
          {isOnBlogPage && (
            <>
              <span className="text-foreground-muted" aria-hidden="true">
                /
              </span>
              <Link
                href="/blog"
                className="font-display text-lg font-medium lowercase hover:text-foreground-muted transition-colors"
              >
                blog
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isOnBlogPage && (
            <Link href="/blog" className="link-default font-mono text-sm">
              blog
            </Link>
          )}
          <SettingsDropdown />
        </div>
      </nav>
    </header>
  );
}
