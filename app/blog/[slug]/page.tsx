import { notFound } from "next/navigation";
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
  const illustration = slug === "vibe-rl" ? "/images/folio/drawing-sketch.webp" : undefined;
  return <main className="folio-width reading-page">
    <article>
      {!sample && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.metadata.title, datePublished: post.metadata.publishedAt, description: post.metadata.summary }).replace(/</g, "\\u003c") }} />}
      <header className="article-header">
        <h1>{post.metadata.title}</h1>
        {post.metadata.image ? (
          <figure className="article-plate"><Image src={post.metadata.image} width={700} height={460} alt={post.metadata.title} /></figure>
        ) : illustration ? (
          <div className="article-sketch"><Image src={illustration} width={1254} height={1254} className="ink-sketch" alt="A simple ink sketch of a drafting compass and two rectangles." sizes="170px" /></div>
        ) : null}
        <div className="post-meta">
          <span>{sample ? "Design sample" : post.metadata.author || "Sriraam Raja"}</span><span>·</span>
          {!sample && <><time dateTime={post.metadata.publishedAt}>{formatDate(post.metadata.publishedAt, false, true)}</time><span>·</span></>}
          <span>{readingTime(post.content)} min read</span>
        </div>
        {sample && <p className="sample-notice">Sample text for the design preview; not a published essay by Sriraam.</p>}
      </header>
      <div className="article-layout">{headings.length > 0 && <nav className="article-toc" aria-label="Table of contents"><details><summary>Table of contents</summary>{headings.map((heading) => <a href={`#${heading.slug}`} key={heading.slug}>{heading.title}</a>)}</details></nav>}<div className="article-body"><CustomMDX source={post.content} /></div></div>
    </article>
  </main>;
}
