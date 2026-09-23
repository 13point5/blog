"use client";

import Image from "next/image";
import Link from "next/link";
import { Moon, Sun, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useTheme } from "../providers/theme-provider";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="collection-header">
      <a href="#main-content" className="skip-link">Skip to collection</a>
      <Link href="/" className="identity" aria-label="Sriraam’s collection">
        <Image src="/avatar.jpeg" alt="" width={38} height={38} priority />
        <span>sriraam<span className="identity-note">learning & making</span></span>
      </Link>
      <nav aria-label="Main navigation">
        <Dialog.Root>
          <Dialog.Trigger className="about-trigger">about</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="reader-overlay" />
            <Dialog.Content className="about-dialog" aria-describedby="about-description">
              <Dialog.Close className="close-button" aria-label="Close about"><X size={18} /></Dialog.Close>
              <Image src="/avatar.jpeg" alt="Illustrated portrait of Sriraam" width={74} height={74} />
              <Dialog.Title>Hey, I’m Sriraam.</Dialog.Title>
              <Dialog.Description id="about-description">I work on teaching machines to learn, and learn from what makes us human.</Dialog.Description>
              <p>Applied Researcher at <a href="https://www.chakra.dev/">Chakra Labs</a>. Previously, learning science at Harvard.</p>
              <p>Also: Hogwarts, anime, K-dramas, and far too many open tabs.</p>
              <div className="about-links"><a href="https://x.com/27upon2">twitter ↗</a><a href="https://github.com/13point5">github ↗</a><a href="https://www.linkedin.com/in/13point5">linkedin ↗</a></div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <button className="theme-switch" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle light and dark theme">
          <Sun className="sun-icon" size={16} /><Moon className="moon-icon" size={16} />
        </button>
      </nav>
    </header>
  );
}
