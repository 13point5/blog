"use client";

import { useTheme } from "../providers/theme-provider";
import { PixelScene } from "./pixel-scene";
import { cn } from "@/lib/utils";

type Props = {
  scene: string;
  interactive?: boolean;
  /** Widest the scene itself is drawn, in CSS px; anything beyond is more scenery. */
  maxPx?: number;
  className?: string;
};

/**
 * A piece of pixel art laid out according to the menu's "Art" settings:
 * across the whole screen or just the text column, in colour or in ink.
 */
export function Art({ scene, interactive, maxPx, className }: Props) {
  const { artWidth, artStyle } = useTheme();
  return (
    <div className={cn(artWidth === "full" && "w-screen ml-[calc(50%-50vw)]", className)}>
      <PixelScene scene={scene} interactive={interactive} wide maxPx={maxPx} ink={artStyle === "ink"} />
    </div>
  );
}

const HOME = {
  shelf: { scene: "shelf", maxPx: 400, hint: "Tap something." },
  castle: { scene: "castle", maxPx: 420, hint: "" },
  pond: { scene: "koi-pond", maxPx: 380, hint: "The koi are hungry. Tap the water." },
} as const;

/** The home page's one piece of art; which one is chosen in the menu. */
export function HomeArt({ className }: { className?: string }) {
  const { homeArt } = useTheme();
  if (homeArt === "scatter") return null; // the toys are spread around the page instead
  const { scene, maxPx, hint } = HOME[homeArt];
  return (
    <aside className={className}>
      <Art key={scene} scene={scene} maxPx={maxPx} interactive />
      {hint && <p className="text-xs text-foreground-muted text-center mt-2">{hint}</p>}
    </aside>
  );
}
