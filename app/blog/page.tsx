import { BlogPosts } from "@/app/components/posts";

export const metadata = {
  title: "Blog",
  description: "Thoughts on AI, engineering, and development by 13point5.",
};

export default function BlogPage() {
  return (
    <main className="desk-page">
      <section className="tracks">
        <div className="tracks-head">
          <h1>TRACKS</h1>
          <p className="tracks-note">writing</p>
        </div>
        <BlogPosts />
      </section>
    </main>
  );
}
