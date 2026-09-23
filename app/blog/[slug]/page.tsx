import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Rewind } from "lucide-react";
import { CustomMDX } from "@/app/components/mdx";
import { getBlogPosts, getHeadings, getSortedPosts } from "@/app/blog/utils";
import { BookCover } from "@/app/components/book-cover";
import { Cassette } from "@/app/components/cassette";
import { ReadingProgress } from "@/app/components/reading-progress";
import { TableOfContents } from "@/app/components/table-of-contents";

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
  const posts = getSortedPosts();
  const post = posts.find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  const headings = getHeadings(post.content);
  const others = posts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className={`swatch-${post.swatch} pt-24 sm:pt-28 pb-10`}>
      <ReadingProgress targetId="post" />
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-[46rem] mx-auto xl:mx-0 xl:ml-[17rem] animate-drop-in">
          <BookCover post={post} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 xl:grid xl:grid-cols-[14rem_minmax(0,46rem)] xl:gap-12">
        <aside className="hidden xl:block">
          <TableOfContents
            headings={headings}
            className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"
          />
        </aside>

        <article
          id="post"
          className="max-w-[46rem] mx-auto xl:mx-0 min-w-0 animate-fade-blur animation-delay-200"
        >
          {headings.length > 0 && (
            <details className="xl:hidden mb-10 group">
              <summary className="key list-none [&::-webkit-details-marker]:hidden w-fit">
                contents · {String(headings.length).padStart(2, "0")}
              </summary>
              <TableOfContents headings={headings} className="mt-4" />
            </details>
          )}

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

          <div className="post-body">
            <CustomMDX source={post.content} />
          </div>

          <div className="mt-16 flex flex-col items-center gap-6 text-center">
            <p className="font-dot font-black text-2xl tracking-tight">
              END OF SIDE A
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#main" className="key">
                <Rewind aria-hidden="true" />
                rewind
              </a>
              <Link href="/blog" className="key key-play">
                <ArrowLeft aria-hidden="true" />
                back to archive
              </Link>
            </div>
          </div>
        </article>
      </div>

      {others.length > 0 && (
        <section
          aria-labelledby="more-heading"
          className="max-w-6xl mx-auto px-4 sm:px-6 mt-24"
        >
          <h2
            id="more-heading"
            className="font-dot font-black text-4xl tracking-tight mb-8"
          >
            NEXT TAPES
          </h2>
          <div className="tape-rail">
            {others.map((p) => (
              <Cassette key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
