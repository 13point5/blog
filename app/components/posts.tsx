import { getSortedPosts } from "@/app/blog/utils";
import { Floppy } from "./floppy";

export function BlogPosts() {
  const posts = getSortedPosts();

  return (
    <ul className="grid gap-x-8 gap-y-12 grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))] not-prose">
      {posts.map((post) => (
        <li key={post.slug} className="max-w-[22rem]">
          <Floppy post={post} />
        </li>
      ))}
    </ul>
  );
}
