import { notFound } from "next/navigation";
import { CustomMDX } from "@/app/components/mdx";
import { formatDate, getBlogPosts, readingMinutes } from "@/app/blog/utils";
import { Art } from "@/app/components/art";

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

  return (
    <div className="max-w-2xl mx-auto px-5 pt-32 pb-8">
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
        {/* The page opens on its title, as the home and blog pages do, with the date under it. */}
        <header className="relative mb-10">
          <h1 className="d-xl mb-4 text-balance"><span data-perch="">{metadata.title}</span></h1>
          <p className="text-sm text-foreground-muted flex flex-wrap gap-x-2">
            <time dateTime={metadata.publishedAt}>{formatDate(metadata.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes(post.content)} min read</span>
          </p>
        </header>

        {/* One piece of pixel art per post, between the title and the text */}
        {metadata.cover && <Art scene={metadata.cover} className="mb-12" />}

        <div className="post-body">
          <CustomMDX source={post.content} />
        </div>
      </article>
    </div>
  );
}
