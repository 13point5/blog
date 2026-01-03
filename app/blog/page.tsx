import Link from "next/link";

type BlogPost = {
  id: string;
  title: string;
  description: string;
  date: Date;
  slug: string;
  author: string;
  coverImage?: string;
};

// Sample blog posts - in a real app, this would come from a CMS or MDX files
const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Complete Markdown and Math Guide",
    description:
      "A comprehensive guide showcasing all supported markdown elements and mathematical notation in MDX.",
    date: new Date("2024-12-29"),
    slug: "markdown-math-guide",
    author: "Sriraam",
    coverImage:
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80",
  },
];

// Group blog posts by month
function groupPostsByMonth(posts: BlogPost[]) {
  const grouped = new Map<string, BlogPost[]>();

  posts.forEach((post) => {
    const monthYear = post.date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!grouped.has(monthYear)) {
      grouped.set(monthYear, []);
    }
    grouped.get(monthYear)!.push(post);
  });

  // Sort posts within each month by date (newest first)
  grouped.forEach((posts) => {
    posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  return grouped;
}

export default function BlogPage() {
  const groupedPosts = groupPostsByMonth(blogPosts);

  return (
    <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
      <div className="animate-fade-blur">
        <h1 className="text-4xl font-medium mb-3">Blog</h1>
        <p className="text-foreground-muted mb-12">
          Thoughts on building, learning, and the intersection of UX and RL.
        </p>

        {/* Blog posts grouped by month */}
        <div className="space-y-12">
          {Array.from(groupedPosts.entries()).map(([monthYear, posts]) => (
            <div key={monthYear}>
              <h2 className="text-xl font-medium mb-6 text-foreground-muted">
                {monthYear}
              </h2>

              <div className="space-y-6">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="block group"
                  >
                    <article className="bg-background-card rounded-2xl p-6 border border-transparent hover:border-border transition-colors duration-200">
                      <div className="flex gap-6 flex-col sm:flex-row">
                        {/* Cover image */}
                        {post.coverImage && (
                          <div className="w-full sm:w-48 h-32 bg-background rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-medium group-hover:text-foreground transition-colors">
                              {post.title}
                            </h3>
                          </div>

                          <p className="text-foreground-muted text-sm mb-3">
                            {post.description}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-foreground-muted">
                            <span>{post.author}</span>
                            <span>•</span>
                            <time
                              dateTime={post.date.toISOString()}
                              className="text-foreground-muted"
                            >
                              {post.date.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </time>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
