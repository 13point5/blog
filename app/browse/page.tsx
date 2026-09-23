import { getBlogPosts } from "../blog/utils";
import { WritingShelf } from "../components/writing-shelf";

export const metadata = { title: "Record store", description: "Flip through a collection of ideas about learning and making." };

export default function BrowsePage() {
  const posts = getBlogPosts().sort((a, b) =>
    Number(a.metadata.draft === "true") - Number(b.metadata.draft === "true") ||
    b.metadata.publishedAt.localeCompare(a.metadata.publishedAt),
  );
  return <section className="collection" aria-label="Writing collection">
    <WritingShelf view="store" posts={posts.map(({ slug, metadata }) => ({ slug, metadata }))} />
  </section>;
}
