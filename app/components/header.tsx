"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsDropdown } from "./settings-dropdown";
export function Header() {
  const pathname = usePathname();
  return <header className="folio-header"><nav className="folio-nav" aria-label="Main navigation">
    <Link className="wordmark" href="/" aria-label="Sriraam, home">Sriraam</Link>
    <div className="nav-links"><Link href="/blog" aria-current={pathname.startsWith("/blog") ? "page" : undefined}>Writing</Link><SettingsDropdown /></div>
  </nav></header>;
}
