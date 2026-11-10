import { notFound } from "next/navigation";
import { CustomMDX } from "@/app/components/mdx";
import { formatDate, getBlogPosts, parseTags, readingMinutes } from "@/app/blog/utils";
import Link from "next/link";
import { PixelScene } from "@/app/components/pixel-scene";
import { PixelWindow } from "@/app/components/pixel-window";
import { ReadingProgress } from "@/app/components/reading-progress";
import { DEFAULT_COVER } from "@/lib/pixel";

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

  const { metadata } = post;
  const tags = parseTags(metadata.tags);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-22 pb-24">
      <ReadingProgress />
      <article className="animate-fade-blur">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: metadata.title,
              datePublished: metadata.publishedAt,
              dateModified: metadata.publishedAt,
              description: metadata.summary,
            }),
          }}
        />
        <Link href="/blog" className="d-sm text-foreground-muted hover:text-koi">
          <span aria-hidden="true">◂</span> all posts
        </Link>

        <header className="mt-4 mb-8">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((t) => (
              <span key={t} className="px-tag">{t}</span>
            ))}
          </div>
          <h1 className="d-2xl mb-3 text-balance">{metadata.title}</h1>
          <p className="d-sm text-foreground-muted flex flex-wrap gap-x-3 gap-y-1">
            <time dateTime={metadata.publishedAt}>{formatDate(metadata.publishedAt)}</time>
            {metadata.author && <span>by {metadata.author}</span>}
            <span>{readingMinutes(post.content)} min read</span>
          </p>
        </header>

        <PixelWindow title={`${slug}.px`} className="mb-8">
          <PixelScene scene={metadata.cover ?? DEFAULT_COVER} />
        </PixelWindow>

        {metadata.placeholder === "true" && (
          <p role="note" className="border-[3px] border-frame bg-gold/25 px-4 py-3 mb-8 text-[0.95em]">
            <strong className="font-display uppercase">Placeholder post.</strong> This one is filler
            written to try out the layout, the covers, and the math rendering. Don&apos;t cite it.
          </p>
        )}

        <div className="post-body">
          <CustomMDX source={post.content} />
        </div>
      </article>
    </div>
  );
}
