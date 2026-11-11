import { BlogPosts } from "@/app/components/posts";
import { Art, WhenArt } from "@/app/components/art";

export const metadata = {
  title: "Blog",
  description: "Notes on RL, LLMs, and benchmarks by Sriraam.",
};

export default function BlogPage() {
  return (
    <div className="relative max-w-2xl mx-auto px-5 pt-28 pb-8">
      {/* Full-screen art: a rainy skyline across the top of the page */}
      <WhenArt width="full">
        <div className="animate-fade-blur -mt-10 mb-8" aria-hidden="true">
          <Art scene="rain-city" maxPx={380} />
        </div>
      </WhenArt>

      <section className="animate-fade-blur">
        <h1 className="d-xl mb-1">Blog</h1>
        <p className="text-foreground-muted mb-6">Notes on RL, LLMs, and benchmarks.</p>
        <BlogPosts />
      </section>

      {/* Column art: the skyline sits in the margin, on screens wide enough to have one */}
      <WhenArt width="column">
        <aside className="hidden xl:block absolute left-full top-29 ml-10 w-64 animate-fade-blur animation-delay-100" aria-hidden="true">
          <Art scene="rain-city" />
        </aside>
      </WhenArt>
    </div>
  );
}
