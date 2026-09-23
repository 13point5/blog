import { notFound } from "next/navigation";
import { CustomMDX } from "@/app/components/mdx";
import { formatDate, getBlogPosts } from "@/app/blog/utils";
import Image from "next/image";
import Link from "next/link";
import { StudioArt } from "@/app/components/studio-art";

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
    <div className="studio-width article-page">
      <article>
        {post.metadata.sample !== "true" && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "BlogPosting", headline: post.metadata.title,
          datePublished: post.metadata.publishedAt, dateModified: post.metadata.publishedAt,
          description: post.metadata.summary, author: { "@type": "Person", name: post.metadata.author || "Sriraam" },
        }).replace(/</g, "\\u003c") }} /> }
        <header className="article-header">
          <div className="eyebrow">{post.metadata.category || "Experiments"} / THE NOTEBOOK</div>
          <h1>{post.metadata.title}</h1>
          <div className="article-meta"><time dateTime={post.metadata.publishedAt}>{formatDate(post.metadata.publishedAt)}</time><span>By {post.metadata.author || "Sriraam"}</span><span>{minutes} min read</span></div>
        </header>
        <div className="article-cover">
          {post.metadata.artwork || !post.metadata.image ? <StudioArt kind={post.metadata.artwork || "disk"} label={post.metadata.artwork === "tape" ? "THE LEARNING LOOP" : post.metadata.artwork === "paper" ? "ROOM TO THINK." : post.metadata.artwork === "disk-green" ? "TRUST, BUT VERIFY." : "VIBE / RL"} /> : <Image src={post.metadata.image} alt={post.metadata.title} width={780} height={420} className="h-auto" />}
        </div>
        {post.metadata.sample === "true" && <aside className="sample-notice">Design sample · This fictional post demonstrates the notebook’s layout and components. It does not report actual research results.</aside>}
        <div className="article-body"><CustomMDX source={post.content} /></div>
        <div className="article-end"><Link href="/blog">← All writing</Link><span>Thanks for spending a little time here. ✳</span></div>
      </article>
    </div>
  );
}
