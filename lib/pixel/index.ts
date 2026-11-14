import type { Scene } from "./engine";
import { rainCity } from "./scenes/rain-city";
import { koiPond } from "./scenes/koi-pond";
import { shelf } from "./scenes/shelf";
import { castle } from "./scenes/castle";
import { hogwarts } from "./scenes/hogwarts";
import { vibeRl } from "./scenes/covers-a";
import { dungeon } from "./scenes/covers-b";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SCENES: Record<string, Scene<any>> = {
  "rain-city": rainCity,
  "koi-pond": koiPond,
  shelf,
  castle,
  hogwarts,
  "vibe-rl": vibeRl,
  dungeon,
};

export type SceneName = keyof typeof SCENES;

/** Cover used when a post's frontmatter doesn't name one. */
export const DEFAULT_COVER = "rain-city";

export function sceneSize(name: string) {
  const s = SCENES[name] ?? SCENES[DEFAULT_COVER];
  return { w: s.w, h: s.h };
}
