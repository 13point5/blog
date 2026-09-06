import { BlogPosts } from "@/app/components/posts";
export const metadata = { title: "Writing", description: "Notes on reinforcement learning, human learning, and the space between them." };
export default function BlogPage() {
  return <main className="folio-width archive-page"><h1>Writing</h1><p className="archive-intro">Notes on reinforcement learning, human learning,<br className="desktop-break" /> and the space between them.</p><BlogPosts /></main>;
}
