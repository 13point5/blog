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
      <WritingShelf posts={posts.map(({ slug, metadata }) => ({ slug, metadata }))} />
    </section>
  );
}
