import Link from "next/link";

type BlogPost = {
  id: string;
  title: string;
  date: Date;
  slug: string;
};

// Sample blog posts - in a real app, this would come from a CMS or MDX files
const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Complete Markdown and Math Guide",
    date: new Date("2024-12-29"),
    slug: "markdown-math-guide",
  },
  {
    id: "2",
    title: "Building Decode: A Browser for AI Agents",
    date: new Date("2024-12-15"),
    slug: "building-decode",
  },
  {
    id: "3",
    title: "Lessons from Learning Design at Harvard",
    date: new Date("2024-12-01"),
    slug: "harvard-learning-design",
  },
  {
    id: "4",
    title: "Understanding Reinforcement Learning Through Practice",
    date: new Date("2024-11-20"),
    slug: "rl-practice",
  },
  {
    id: "5",
    title: "Why UX is a Learning Problem",
    date: new Date("2024-11-05"),
    slug: "ux-learning-problem",
  },
  {
    id: "6",
    title: "Building SWE-Grep: An Open Source SWE Agent",
    date: new Date("2024-10-28"),
    slug: "swe-grep",
  },
  {
    id: "7",
    title: "Contributing to Prime Intellect's RL Environments",
    date: new Date("2024-10-10"),
    slug: "prime-intellect-rl",
  },
  {
    id: "8",
    title: "The Intersection of Education and Technology",
    date: new Date("2024-09-22"),
    slug: "education-technology",
  },
  {
    id: "9",
    title: "Designing for Agent Collaboration",
    date: new Date("2024-09-05"),
    slug: "agent-collaboration",
  },
  {
    id: "10",
    title: "My Journey into AI Research",
    date: new Date("2024-08-18"),
    slug: "ai-research-journey",
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
      <div className="animate-fade-blur space-y-12">
        {Array.from(groupedPosts.entries()).map(([monthYear, posts]) => (
          <div key={monthYear}>
            <h2 className="text-xl font-medium mb-6 text-foreground-muted">
              {monthYear}
            </h2>

            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <article className="flex items-baseline justify-between gap-4 py-3 border-b border-border/50 hover:border-border transition-colors">
                    <h3 className="text-lg font-medium group-hover:text-foreground-muted transition-colors flex-1">
                      {post.title}
                    </h3>
                    <time
                      dateTime={post.date.toISOString()}
                      className="text-sm text-foreground-muted whitespace-nowrap"
                    >
                      {post.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
