import { notFound } from "next/navigation";
import { CustomMDX } from "@/app/components/mdx";
import { formatDate, getBlogPosts } from "@/app/blog/utils";
import Link from "next/link";
import Image from "next/image";

export async function generateStaticParams() {
  const posts = getBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) {
    return;
  }

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
  } = post.metadata;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
    },
    ...(post.metadata.draft === "true" ? { robots: { index: false, follow: true } } : {}),
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  const minutes = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 220));
  return (
    <div className="article-page">
      <Link href="/" className="back-link">← Collection</Link>
      <article>
        {post.metadata.draft !== "true" && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "BlogPosting", headline: post.metadata.title,
          datePublished: post.metadata.publishedAt, dateModified: post.metadata.publishedAt,
          description: post.metadata.summary, author: { "@type": "Person", name: post.metadata.author || "Sriraam" },
        }).replace(/</g, "\\u003c") }} /> }
        <header className="article-header">
          <div className="article-type">{post.metadata.category || "Experiments"}</div>
          <h1>{post.metadata.title}</h1>
          <div className="article-meta"><time dateTime={post.metadata.publishedAt}>{formatDate(post.metadata.publishedAt)}</time>{post.metadata.author && <span>By {post.metadata.author}</span>}{post.metadata.draft === "true" && <span className="draft-label">Draft note</span>}<span>{minutes} min read</span></div>
        </header>
        {post.metadata.image && <figure className="article-illustration"><Image src={post.metadata.image} alt={post.metadata.imageAlt || post.metadata.title} width={960} height={520} sizes="(max-width: 720px) 100vw, 720px" priority /></figure>}
        <div className="article-body"><CustomMDX source={post.content} /></div>
        <div className="article-end"><Link href="/">← Collection</Link></div>
      </article>
    </div>
  );
}
