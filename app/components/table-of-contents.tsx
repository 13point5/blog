"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/app/blog/utils";
import { cn } from "@/lib/utils";

/** Contents styled as a library checkout card; stamps the current chapter. */
export function TableOfContents({
  headings,
  className,
}: {
  headings: Heading[];
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return;

    const update = () => {
      // last heading that has scrolled past the upper third of the viewport
      const line = window.innerHeight * 0.3;
      let current: string | null = null;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav aria-label="Contents" className={cn("library-card", className)}>
      <div className="library-card-title" aria-hidden="true">
        <span>Contents</span>
        <span>{String(headings.length).padStart(2, "0")}</span>
      </div>
      <ol>
        {headings.map((h, i) => (
          <li key={h.slug}>
            <a
              href={`#${h.slug}`}
              title={h.text}
              data-active={active === h.slug}
              aria-current={active === h.slug ? "location" : undefined}
              style={h.level > 1 ? { paddingLeft: "3.4rem" } : undefined}
            >
              <span className="toc-num">{String(i + 1).padStart(2, "0")}</span>
              <span>{h.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
