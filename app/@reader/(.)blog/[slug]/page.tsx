import { notFound } from "next/navigation";
import BlogPost, { generateMetadata } from "@/app/blog/[slug]/page";
import { getBlogPosts } from "@/app/blog/utils";
import { ReaderDialog } from "@/app/components/reader-dialog";

export { generateMetadata };

export default async function ReadObject({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPosts().find((entry) => entry.slug === slug);
  if (!post) notFound();

  return <ReaderDialog title={post.metadata.title} slug={slug}><BlogPost params={params} /></ReaderDialog>;
}
