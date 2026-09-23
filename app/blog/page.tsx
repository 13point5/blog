import { getBlogPosts } from "./utils";
import { WritingShelf } from "../components/writing-shelf";

export const metadata = { title: "Writing", description: "Experiments, field notes, and thoughts on machine and human learning." };

export default function BlogPage() {
  const posts = getBlogPosts().sort((a, b) => (Number(a.metadata.sample === "true") - Number(b.metadata.sample === "true")) || b.metadata.publishedAt.localeCompare(a.metadata.publishedAt));
  return <div className="studio-width archive-page"><div className="eyebrow">THE NOTEBOOK</div><h1>Ideas in <em>motion.</em></h1><p className="archive-intro">Some carefully tested. Some still taking shape.<br />Notes on learning, building, and paying attention.</p><WritingShelf posts={posts.map(({ slug, metadata }) => ({ slug, metadata }))} /></div>;
}
