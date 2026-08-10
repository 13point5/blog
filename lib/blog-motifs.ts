export type BlogMotif =
  | "llm"
  | "rl"
  | "architecture"
  | "evals"
  | "agents"
  | "default";

export const MOTIF_STAMPS: Record<BlogMotif, { src: string; alt: string }> = {
  llm: {
    src: "/images/vintage/stamp-llm-automaton.webp",
    alt: "Vintage postage stamp of a clockwork automaton, for language models",
  },
  rl: {
    src: "/images/vintage/stamp-rl-labyrinth.webp",
    alt: "Vintage postage stamp of a labyrinth and compass, for reinforcement learning",
  },
  architecture: {
    src: "/images/vintage/stamp-architecture-columns.webp",
    alt: "Vintage postage stamp of classical columns, for model architectures",
  },
  evals: {
    src: "/images/vintage/stamp-evals-scales.webp",
    alt: "Vintage postage stamp of balance scales, for evaluations",
  },
  agents: {
    src: "/images/vintage/stamp-agents-map.webp",
    alt: "Vintage postage stamp of a navigational map, for agents",
  },
  default: {
    src: "/images/vintage/stamp-llm-automaton.webp",
    alt: "Vintage postage stamp motif",
  },
};

export function resolveMotif(motif?: string): BlogMotif {
  switch (motif) {
    case "llm":
    case "rl":
    case "architecture":
    case "evals":
    case "agents":
      return motif;
    default:
      return "default";
  }
}
