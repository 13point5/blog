import { getBlogPosts } from "./blog/utils";
import { KineticArchive } from "./components/kinetic-archive";

export default function Home() {
  const posts = getBlogPosts().sort(
    (a, b) =>
      Number(a.metadata.draft === "true") - Number(b.metadata.draft === "true") ||
      b.metadata.publishedAt.localeCompare(a.metadata.publishedAt),
  );

  return (
    <section className="collection" aria-label="Writing collection">
      <KineticArchive posts={posts.map(({ slug, metadata }) => ({ slug, metadata }))} />
    </section>
  );
}
