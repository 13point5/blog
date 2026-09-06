export function slugifyHeading(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-").replace(/&/g, "-and-").replace(/[^\w-]+/g, "").replace(/--+/g, "-");
}
export function getTableOfContents(content: string) {
  const headings: { title: string; slug: string }[] = [];
  let fence: { marker: string; length: number } | undefined;
  for (const line of content.split("\n")) {
    const delimiter = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (delimiter && delimiter[1][0] === fence.marker && delimiter[1].length >= fence.length && !delimiter[2].trim()) fence = undefined;
      continue;
    }
    if (delimiter) { fence = { marker: delimiter[1][0], length: delimiter[1].length }; continue; }
    const heading = line.match(/^#{1,2}\s+(.+)$/);
    if (heading) {
      const title = heading[1].replace(/[*`]/g, "");
      headings.push({ title, slug: slugifyHeading(title) });
    }
  }
  return headings;
}
