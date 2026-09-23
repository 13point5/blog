import { notFound } from "next/navigation";
import { CustomMDX } from "@/app/components/mdx";
import { formatDate, getBlogPosts } from "@/app/blog/utils";
import Link from "next/link";

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
    ...(post.metadata.sample === "true" ? { robots: { index: false, follow: true } } : {}),
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
      <article>
        {post.metadata.sample !== "true" && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "BlogPosting", headline: post.metadata.title,
          datePublished: post.metadata.publishedAt, dateModified: post.metadata.publishedAt,
          description: post.metadata.summary, author: { "@type": "Person", name: post.metadata.author || "Sriraam" },
        }).replace(/</g, "\\u003c") }} /> }
        <header className="article-header">
          <div className="article-type">{post.metadata.category || "Experiments"}</div>
          <h1>{post.metadata.title}</h1>
          <div className="article-meta"><time dateTime={post.metadata.publishedAt}>{formatDate(post.metadata.publishedAt)}</time><span>By {post.metadata.author || "Sriraam"}</span><span>{minutes} min read</span></div>
        </header>
        {post.metadata.sample === "true" && <aside className="sample-notice">Sample post · An illustrative piece for this collection, not a report of research results.</aside>}
        <div className="article-body"><CustomMDX source={post.content} /></div>
        <div className="article-end"><Link href="/">← Collection</Link></div>
      </article>
    </div>
  );
}
