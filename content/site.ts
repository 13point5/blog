import type { PixelIconName } from "@/app/components/pixel-icon";

// Home-page content that isn't prose. Edit freely.

export const player = [
  { k: "name", v: "sriraam" },
  { k: "class", v: "applied researcher" },
  { k: "guild", v: "chakra labs · post-training" },
  { k: "origin", v: "harvard · learning science" },
];

/** Research interests, shown as a quest log. */
export const quests = [
  "Sample efficiency",
  "Continual learning",
  "Human simulation",
  "Mech interp + RL",
  "World models and neural RL envs",
  "Sycophancy and adaptive reasoning",
];

export const inventory: { icon: PixelIconName; label: string }[] = [
  { icon: "wand", label: "Hogwarts" },
  { icon: "sword", label: "Anime" },
  { icon: "tv", label: "K-dramas" },
];
