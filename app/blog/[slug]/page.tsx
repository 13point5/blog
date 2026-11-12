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
    <div className="max-w-2xl mx-auto px-5 pt-20 pb-8">
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
        {/* One piece of pixel art per post, above the title */}
        {metadata.cover && <Art scene={metadata.cover} className="-mt-6 mb-8" />}

        <header className="relative mb-10">
          <h1 className="d-xl mb-4 text-balance"><span data-perch="7" data-perch-side="">{metadata.title}</span></h1>
          <p className="text-sm text-foreground-muted flex flex-wrap gap-x-2">
            <time dateTime={metadata.publishedAt}>{formatDate(metadata.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes(post.content)} min read</span>
          </p>
        </header>

        {metadata.placeholder === "true" && (
          <p role="note" className="text-sm text-foreground-muted italic mb-8">
            This is a placeholder post, written to try out the layout and the math. Don&apos;t cite it.
          </p>
        )}

        <div className="post-body">
          <CustomMDX source={post.content} />
        </div>
      </article>
    </div>
  );
}
