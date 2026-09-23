"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsDropdown } from "./settings-dropdown";

export function Header() {
  const pathname = usePathname();
  const onTracks = pathname.startsWith("/blog");

  return (
    <header className="desk-nav">
      <Link href="/" className="desk-mark">
        sriraam
      </Link>
      <nav aria-label="Main">
        <Link className="desk-key" href="/" aria-current={pathname === "/" ? "page" : undefined}>
          desk
        </Link>
        <Link className="desk-key" href="/blog" aria-current={onTracks ? "page" : undefined}>
          tracks
        </Link>
        <SettingsDropdown />
      </nav>
    </header>
  );
}
