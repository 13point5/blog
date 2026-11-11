"use client";

import { useTheme } from "../providers/theme-provider";
import { PixelScene } from "./pixel-scene";
import { cn } from "@/lib/utils";

type Props = {
  scene: string;
  interactive?: boolean;
  /** Widest the scene itself gets when the art spans the screen. */
  maxPx?: number;
  className?: string;
  /** Extra classes for the column-width version only. */
  columnClassName?: string;
};

/**
 * A piece of pixel art laid out according to the menu's "Art" settings:
 * the width of the text column or the whole screen, with hard or crumbling edges.
 */
export function Art({ scene, interactive, maxPx, className, columnClassName }: Props) {
  const { artWidth, artEdge } = useTheme();
  const dissolving = artEdge === "dissolve";

  if (artWidth === "full") {
    return (
      <div className={cn("w-screen ml-[calc(50%-50vw)]", className)}>
        <PixelScene scene={scene} interactive={interactive} wide maxPx={maxPx} dissolve={dissolving ? "band" : undefined} />
      </div>
    );
  }
  return (
    <div className={cn(className, columnClassName)}>
      <PixelScene scene={scene} interactive={interactive} dissolve={dissolving ? "all" : undefined} />
    </div>
  );
}

/** Renders its children only for one of the two art widths. */
export function WhenArt({ width, children }: { width: "column" | "full"; children: React.ReactNode }) {
  const { artWidth } = useTheme();
  return artWidth === width ? <>{children}</> : null;
}
