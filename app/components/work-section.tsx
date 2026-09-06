import Image from "next/image";
import Link from "next/link";
import { formatDate, getBlogPosts, readingTime } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";
export default function WorkSection() {
  const posts = getBlogPosts();
  const featured = posts.find((post) => post.slug === "vibe-rl");
  const remaining = posts.filter((post) => post !== featured).sort((a, b) => b.metadata.publishedAt.localeCompare(a.metadata.publishedAt)).slice(0, 4);
  return <section className="writing-section" id="blog" aria-labelledby="writing-title">
    <div className="section-heading"><h2 id="writing-title">From the notebook</h2><Link className="text-link" href="/blog">All writing <span aria-hidden="true">↗</span></Link></div>
    {featured && <Link href={`/blog/${featured.slug}`} className="featured-post"><div className="featured-plate"><Image src="/images/folio/automaton.webp" alt="" width={1254} height={1254} className="engraving" sizes="(max-width: 700px) 140px, 240px" /></div><div className="featured-copy"><p className="eyebrow">An experiment in reinforcement learning</p><h3>{featured.metadata.title}</h3><p>{featured.metadata.summary}</p><div className="post-meta"><time dateTime={featured.metadata.publishedAt}>{formatDate(featured.metadata.publishedAt, false, true)}</time><span>·</span><span>{readingTime(featured.content)} min read</span></div><span className="text-link">Read the field notes <span aria-hidden="true">↗</span></span></div></Link>}
    <div className="essay-list">{remaining.map((post) => <BlogPostItem key={post.slug} {...post} />)}</div>
  </section>;
}
