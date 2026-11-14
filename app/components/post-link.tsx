"use client";

import Link from "next/link";
import { SCENE_SOUNDS } from "./pixel-scene";

/** A link to a post that plays the post's own little sound as you set off. */
export function PostLink({ href, sound, className, children }: { href: string; sound?: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={className} onClick={() => sound && SCENE_SOUNDS[sound]?.()}>
      {children}
    </Link>
  );
}
