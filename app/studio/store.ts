import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { validateDocument, type StudioDocument } from "./document";

const directory = path.join(process.cwd(), "app/blog/posts");
const session = globalThis as typeof globalThis & {
  studioToken?: string;
  studioQueue?: Promise<unknown>;
};
export const localEditing =
  process.env.NODE_ENV === "development" && !process.env.VERCEL;
export function capability() {
  return (session.studioToken ??= randomBytes(32).toString("hex"));
}
export function revision(source: string) {
  return createHash("sha256").update(source).digest("hex");
}
export function validSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 100;
}
export async function documents(): Promise<StudioDocument[]> {
  const names = (await fs.readdir(directory))
    .filter((name) => name.endsWith(".mdx"))
    .sort();
  return Promise.all(
    names.map(async (name) => {
      const source = await fs.readFile(path.join(directory, name), "utf8");
      return { slug: name.slice(0, -4), source, revision: revision(source) };
    }),
  );
}
export function allowRequest(request: Request) {
  const url = new URL(request.url);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  // Next normalizes request.url to localhost in development, even when the
  // browser uses 127.0.0.1. Compare the browser Origin with the actual Host.
  const host = request.headers.get("host") || "";
  const expectedOrigin = `${url.protocol}//${host}`;
  const localHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);
  return (
    localEditing &&
    loopback &&
    localHost &&
    request.headers.get("origin") === expectedOrigin &&
    request.headers.get("x-studio-token") === capability() &&
    request.headers.get("content-type")?.split(";")[0] === "application/json"
  );
}
export async function saveDocument(input: StudioDocument) {
  // Serialize writes within the local process, including revision check + rename.
  const operation = (session.studioQueue ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      if (!validSlug(input.slug))
        throw new Error(
          "Use lowercase letters, numbers, and hyphens for the filename.",
        );
      validateDocument(input.source);
      const target = path.join(directory, `${input.slug}.mdx`);
      let disk: string | null = null;
      try {
        const stat = await fs.lstat(target);
        if (!stat.isFile() || stat.isSymbolicLink())
          throw new Error("Only regular MDX files can be edited.");
        disk = await fs.readFile(target, "utf8");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      if ((disk === null ? null : revision(disk)) !== input.revision)
        return {
          conflict: true as const,
          disk,
          diskRevision: disk === null ? null : revision(disk),
        };
      const temporary = path.join(
        directory,
        `.${input.slug}.${randomBytes(6).toString("hex")}.tmp`,
      );
      try {
        await fs.writeFile(temporary, input.source, {
          flag: "wx",
          mode: 0o600,
        });
        // Recheck after writing the temporary file to catch external editor changes.
        const latest = await fs
          .readFile(target, "utf8")
          .catch((error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") return null;
            throw error;
          });
        if (latest !== disk)
          return {
            conflict: true as const,
            disk: latest,
            diskRevision: latest === null ? null : revision(latest),
          };
        if (disk === null) {
          await fs.link(temporary, target);
        } else {
          await fs.rename(temporary, target);
        }
      } finally {
        await fs.unlink(temporary).catch(() => {});
      }
      return { conflict: false as const, revision: revision(input.source) };
    });
  session.studioQueue = operation;
  return operation;
}
