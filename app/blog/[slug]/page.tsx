import { notFound } from "next/navigation";
import { CustomMDX } from "@/app/components/mdx";
import { formatDate, getBlogPosts } from "@/app/blog/utils";
import Image from "next/image";
import { PostageStamp } from "@/app/components/vintage/postage-stamp";
import { MOTIF_STAMPS, resolveMotif } from "@/lib/blog-motifs";

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

  const motif = resolveMotif(post.metadata.motif);
  const stamp = post.metadata.stamp
    ? { src: post.metadata.stamp, alt: post.metadata.title }
    : MOTIF_STAMPS[motif];

  return (
    <main className="relative mx-auto max-w-3xl px-6 pt-20 pb-20">
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <article className="prose prose-lg animate-fade-blur relative">
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

        <div className="mb-8 flex flex-col items-center text-center">
          <PostageStamp
            src={stamp.src}
            alt={stamp.alt}
            size="lg"
            className="mb-6 rotate-[-2deg]"
            priority
          />
          <p className="font-[family-name:var(--font-script)] text-lg text-[var(--mustard)] capitalize">
            {motif === "default" ? "field note" : motif}
          </p>
          <h1 className="!mt-2 font-[family-name:var(--font-display)] !text-4xl font-semibold tracking-tight text-[var(--ink)] sm:!text-5xl">
            {post.metadata.title}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--ink-muted)]">
            <time>{formatDate(post.metadata.publishedAt)}</time>
            {post.metadata.author && (
              <>
                <span>·</span>
                <span className="font-[family-name:var(--font-script)] text-base text-[var(--mustard)]">
                  {post.metadata.author}
                </span>
              </>
            )}
          </div>
        </div>

        {post.metadata.image && (
          <div className="mx-auto mb-10 max-w-md overflow-hidden border border-[var(--ink)]/15 bg-[var(--parchment-deep)] p-2">
            <Image
              src={post.metadata.image}
              alt={post.metadata.title}
              width={640}
              height={800}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        )}

        <CustomMDX source={post.content} />
      </article>
    </main>
  );
}
