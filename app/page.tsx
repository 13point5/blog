import WorkSection from "./components/work-section";
import { ThemedHero } from "./components/themed-hero";
import { getBlogPosts } from "./blog/utils";
import Bio from "@/content/bio.mdx";

export default function Home() {
  const posts = getBlogPosts()
    .sort(
      (a, b) =>
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime()
    )
    .map((post) => ({
      slug: post.slug,
      title: post.metadata.title,
      publishedAt: post.metadata.publishedAt,
    }));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-25 flex flex-col">
      {/* Marauder's Map / Arc Reactor themes only */}
      <ThemedHero posts={posts} />

      {/* Hero Section */}
      <section id="bio" className="animate-fade-blur scroll-mt-16">
        <Bio />
      </section>

      {/* Blog Section */}
      <WorkSection />

      {/* Contact Section */}
      {/* <section id="contact" className="animate-fade-blur animation-delay-200">
        <Contact />
      </section> */}
    </main>
  );
}
