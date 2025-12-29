"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers, Box, PenLine } from "lucide-react";

type Item = {
  id: number;
  title: string;
  description: string;
  year: string;
  link: string;
  type: "project" | "writing";
  image?: string | null;
};

const items: Item[] = [
  {
    id: 0,
    title: "Markdown & Math Guide",
    description:
      "A comprehensive guide showcasing all supported markdown elements and mathematical notation.",
    year: "2024",
    link: "/blog",
    type: "writing",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: 1,
    title: "Decode",
    description:
      "Building a browser and whiteboard for Claude Code. Making AI agents tangible and collaborative.",
    year: "2024",
    link: "#",
    type: "project",
    image: null,
  },
  {
    id: 2,
    title: "SWE-Grep",
    description:
      "Open source SWE agent model. Learning RL by building with a team at CMU under Prof Graham Neubig.",
    year: "2024",
    link: "#",
    type: "project",
    image: null,
  },
  {
    id: 3,
    title: "Prime Intellect",
    description:
      "Building RL environments through their bounty program. Designing challenges for agent training.",
    year: "2024",
    link: "#",
    type: "project",
    image: null,
  },
  {
    id: 4,
    title: "Coming soon",
    description:
      "Thoughts on building, learning, and the intersection of UX and RL.",
    year: "2024",
    link: "#",
    type: "writing",
    image: null,
  },
];

const filters = [
  { label: "All", value: "all", icon: Layers },
  { label: "Projects", value: "project", icon: Box },
  { label: "Writing", value: "writing", icon: PenLine },
] as const;

type FilterValue = (typeof filters)[number]["value"];

export default function WorkSection() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");

  const filteredItems =
    activeFilter === "all"
      ? items
      : items.filter((item) => item.type === activeFilter);

  return (
    <section id="work" className="animate-fade-blur animation-delay-100">
      <h2 className="text-2xl font-medium mb-6">work</h2>

      {/* Filter buttons */}
      <div className="flex items-center gap-3 mb-8">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <Button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              variant={
                activeFilter === filter.value
                  ? "filterActive"
                  : "filterInactive"
              }
              className="rounded-full gap-1.5"
            >
              <Icon size={16} />
              {filter.label}
            </Button>
          );
        })}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <a
            key={item.id}
            href={item.link}
            className="block group bg-background-card rounded-2xl p-5 border border-transparent hover:border-border transition-colors duration-200"
          >
            {/* Image */}
            <div className="aspect-video lg:aspect-[4/3] bg-background rounded-xl mb-4 overflow-hidden flex items-center justify-center">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-5xl opacity-20">
                  {item.type === "project" ? "🔧" : "✍️"}
                </div>
              )}
            </div>

            {/* Type label */}
            <p className="text-foreground-muted text-xs mb-1">{item.type}</p>

            {/* Title */}
            <h3 className="font-medium">{item.title}</h3>
          </a>
        ))}
      </div>
    </section>
  );
}
