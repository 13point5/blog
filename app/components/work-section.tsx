"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type Item = {
  id: number;
  title: string;
  description: string;
  year: string;
  link: string;
  image?: string | null;
};

const items: Item[] = [
  {
    id: 0,
    title: "Markdown & Math Guide",
    description:
      "A comprehensive guide showcasing all supported markdown elements and mathematical notation.",
    year: "2024",
    link: "/blog/markdown-math-guide",
    image:
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: 4,
    title: "Coming soon",
    description:
      "Thoughts on building, learning, and the intersection of UX and RL.",
    year: "2024",
    link: "#",
    image: null,
  },
];

export default function WorkSection() {
  return (
    <section id="blog" className="animate-fade-blur animation-delay-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium">blog</h2>
        <Link href="/blog">
          <Button variant="ghost" className="gap-2 group">
            View All
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Button>
        </Link>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
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
                <div className="text-5xl opacity-20">✍️</div>
              )}
            </div>

            {/* Title */}
            <h3 className="font-medium">{item.title}</h3>
          </a>
        ))}
      </div>
    </section>
  );
}
