import { BlogPosts } from "@/app/components/posts";
export const metadata = { title: "Writing", description: "Field notes on reinforcement learning, human learning, and the curious space between them." };
export default function BlogPage() {
  return <main className="folio-width archive-page"><p className="eyebrow">Essays & experiments</p><h1>The notebook<span className="title-period">.</span></h1><p className="archive-intro">Field notes on reinforcement learning, human learning,<br className="desktop-break" /> and the curious space between them.</p><div className="archive-rule"><span className="eyebrow">All writing</span><span className="fleuron" aria-hidden="true">❦</span></div><BlogPosts /></main>;
}
