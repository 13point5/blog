import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CustomMDX } from "@/app/components/mdx";
import { formatDate, getBlogPosts, readingTime } from "@/app/blog/utils";
import { getTableOfContents } from "@/lib/headings";
export async function generateStaticParams() { return getBlogPosts().map((post) => ({ slug: post.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) return;
  const { title, publishedAt: publishedTime, summary: description } = post.metadata;
  return { title, description, ...(post.metadata.sample === "true" ? { robots: { index: false, follow: false } } : {}), openGraph: { title, description, type: "article", publishedTime }, twitter: { card: "summary_large_image", title, description } };
}
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) notFound();
  const sample = post.metadata.sample === "true";
  const headings = getTableOfContents(post.content);
  const illustration = post.metadata.illustration || (slug === "vibe-rl" ? "/images/folio/automaton.webp" : undefined);
  return <main className="folio-width reading-page"><Link className="back-link" href="/blog">← Back to the notebook</Link>
    <article>
      {!sample && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.metadata.title, datePublished: post.metadata.publishedAt, description: post.metadata.summary }).replace(/</g, "\\u003c") }} />}
      <header className="article-header"><p className="eyebrow">{post.metadata.category || "Reinforcement learning · Field notes"}</p><h1>{post.metadata.title}</h1><p className="article-deck">{post.metadata.summary}</p><div className="post-meta"><span>{sample ? "Design sample" : post.metadata.author || "Sriraam Raja"}</span><span>·</span>{!sample && <><time dateTime={post.metadata.publishedAt}>{formatDate(post.metadata.publishedAt, false, true)}</time><span>·</span></>}<span>{readingTime(post.content)} min read</span></div>
      {sample && <p className="sample-notice">Sample essay for this design experiment. Illustrative writing, not a published research claim or a finished essay by Sriraam.</p>}</header>
      {illustration && <figure className="article-plate"><Image src={illustration} width={1536} height={1024} className="engraving" alt={slug === "vibe-rl" ? "An engraved mechanical hand drawing diagrams with a quill." : "An antique map of branching paths, with one path returning to an earlier choice."} sizes="(max-width: 700px) 90vw, 670px" /><figcaption>{slug === "vibe-rl" ? "Fig. I — Teaching a machine to leave a legible mark." : "Fig. I — Progress sometimes begins by returning to a fork."}</figcaption></figure>}
      {post.metadata.image && <figure className="article-plate"><Image src={post.metadata.image} width={700} height={460} alt={post.metadata.title} /></figure>}
      <div className="article-layout">{headings.length > 0 && <nav className="article-toc" aria-label="On this page"><details><summary>In these notes</summary>{headings.map((heading) => <a href={`#${heading.slug}`} key={heading.slug}>{heading.title}</a>)}</details></nav>}<div className="article-body"><CustomMDX source={post.content} /></div></div>
      <div className="article-end"><Link className="text-link" href="/blog">← More from the notebook</Link><span className="fleuron" aria-hidden="true">❦</span><a className="text-link" href="https://x.com/27upon2">Compare notes ↗</a></div>
    </article>
  </main>;
}
