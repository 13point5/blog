"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "../providers/theme-provider";
import { MaraudersMap } from "./marauders-map";
import { ArcReactor } from "./arc-reactor";

export type HeroPost = { slug: string; title: string; publishedAt: string };

function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ThemedHero({ posts }: { posts: HeroPost[] }) {
  const { theme } = useTheme();
  const hasMounted = useHasMounted();

  // The theme lives in localStorage, so only render once it can be read.
  return (
    <div className="themed-hero">
      {hasMounted && theme === "map" && <MaraudersMap posts={posts} />}
      {hasMounted && theme === "reactor" && <ArcReactor posts={posts} />}
    </div>
  );
}
