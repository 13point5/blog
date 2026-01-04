import { notFound } from "next/navigation";
import { CustomMDX } from "@/app/components/mdx";
import { formatDate, getBlogPosts } from "@/app/blog/utils";
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

  return (
    <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
      <article className="prose prose-lg animate-fade-blur">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.metadata.title,
              datePublished: post.metadata.publishedAt,
              dateModified: post.metadata.publishedAt,
              description: post.metadata.summary,
            }),
          }}
        />
        <h1 className="text-3xl font-semibold mb-4 mt-8 text-foreground text-center">
          {post.metadata.title}
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-foreground-muted mb-6">
          <time>{formatDate(post.metadata.publishedAt)}</time>
          {post.metadata.author && (
            <>
              <span>•</span>
              <span>{post.metadata.author}</span>
            </>
          )}
        </div>

        {post.metadata.image && (
          <div className="max-w-lg mx-auto mb-8">
            <Image
              src={post.metadata.image}
              alt={post.metadata.title}
              width={500}
              height={350}
              className="h-auto rounded-lg"
            />
          </div>
        )}

        <CustomMDX source={post.content} />
      </article>
    </main>
  );
}
