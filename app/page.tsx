import { getBlogPosts } from "./blog/utils";
import { WritingShelf } from "./components/writing-shelf";

export default function Home() {
  const posts = getBlogPosts().sort(
    (a, b) =>
      Number(a.metadata.draft === "true") - Number(b.metadata.draft === "true") ||
      b.metadata.publishedAt.localeCompare(a.metadata.publishedAt),
  );

  return (
    <section className="collection" aria-label="Writing collection">
      <h1 className="collection-intro">A few things I’ve been thinking about.</h1>
      <WritingShelf posts={posts.map(({ slug, metadata }) => ({ slug, metadata }))} />
    </section>
  );
}
