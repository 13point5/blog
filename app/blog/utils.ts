import fs from "fs";
import path from "path";

export type Metadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
  author?: string;
  /** Optional swatch name (see SWATCHES) to override the post's colour */
  color?: string;
};

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match![1];
  const content = fileContent.replace(frontmatterRegex, "").trim();
  const frontMatterLines = frontMatterBlock.trim().split("\n");
  const metadata: Partial<Metadata> = {};

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(": ");
    let value = valueArr.join(": ").trim();
    value = value.replace(/^['"](.*)['"]$/, "$1"); // Remove quotes
    metadata[key.trim() as keyof Metadata] = value;
  });

  return { metadata: metadata as Metadata, content };
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return parseFrontmatter(rawContent);
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

export function getBlogPosts() {
  return getMDXData(path.join(process.cwd(), "app", "blog", "posts"));
}

export const SWATCHES = [
  "tangerine",
  "cobalt",
  "grass",
  "tomato",
  "lemon",
  "navy",
  "bubblegum",
  "graphite",
] as const;

export type Swatch = (typeof SWATCHES)[number];

export type Post = ReturnType<typeof getMDXData>[number] & {
  /** 1-based, chronological: the first post ever written is No. 01 */
  issue: number;
  swatch: Swatch;
  words: number;
  minutes: number;
};

/** Iterate over markdown lines that are not inside fenced code blocks. */
function proseLines(content: string) {
  const lines: string[] = [];
  let fence: string | null = null;
  for (const line of content.split("\n")) {
    const match = /^\s*(`{3,}|~{3,})/.exec(line);
    if (match) {
      if (!fence) fence = match[1];
      else if (match[1][0] === fence[0] && match[1].length >= fence.length)
        fence = null;
      continue;
    }
    if (!fence) lines.push(line);
  }
  return lines;
}

function countWords(content: string) {
  return proseLines(content)
    .join(" ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/**
 * Posts newest-first, each with a stable issue number and colour so the
 * same post looks the same on its tape, disk and book cover.
 */
export function getSortedPosts(): Post[] {
  const chronological = getBlogPosts().sort(
    (a, b) =>
      new Date(a.metadata.publishedAt).getTime() -
      new Date(b.metadata.publishedAt).getTime()
  );

  return chronological
    .map((post, i) => {
      const words = countWords(post.content);
      const requested = post.metadata.color as Swatch | undefined;
      return {
        ...post,
        issue: i + 1,
        swatch:
          requested && SWATCHES.includes(requested)
            ? requested
            : SWATCHES[i % SWATCHES.length],
        words,
        minutes: Math.max(1, Math.round(words / 230)),
      };
    })
    .reverse();
}

export function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export type Heading = { level: number; text: string; slug: string };

/** Top-level (#, ##) headings outside code fences, for the contents card. */
export function getHeadings(content: string): Heading[] {
  return proseLines(content).flatMap((line) => {
    const match = /^(#{1,2})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) return [];
    const text = match[2];
    return [{ level: match[1].length, text, slug: slugify(text) }];
  });
}

export function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

/** "2026-03-05" -> "03.05.26" (floppy-label style) */
export function stampDate(date: string) {
  const [y, m, d] = date.slice(0, 10).split("-");
  return `${m}.${d}.${y.slice(2)}`;
}

export function formatDate(date: string, includeRelative = false, abbreviated = false) {
  const currentDate = new Date();
  if (!date.includes("T")) {
    date = `${date}T00:00:00`;
  }
  const targetDate = new Date(date);

  const yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
  const monthsAgo = currentDate.getMonth() - targetDate.getMonth();
  const daysAgo = currentDate.getDate() - targetDate.getDate();

  let formattedDate = "";

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`;
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`;
  } else {
    formattedDate = "Today";
  }

  const fullDate = targetDate.toLocaleString("en-us", {
    month: abbreviated ? "short" : "long",
    day: "numeric",
    year: "numeric",
  });

  if (!includeRelative) {
    return fullDate;
  }

  return `${fullDate} (${formattedDate})`;
}
