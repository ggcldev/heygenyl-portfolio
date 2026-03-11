import type { CollectionEntry } from "astro:content";

const normalizeSegment = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeSlugPath = (value: string) =>
  value
    .split("/")
    .map((segment) => normalizeSegment(segment))
    .filter(Boolean)
    .join("/");

export const getBlogPostSlug = (post: CollectionEntry<"blog">) => {
  const explicitSlug = post.data.slug?.trim();
  if (explicitSlug) {
    return normalizeSlugPath(explicitSlug);
  }

  const normalizedId = post.id.replaceAll("\\", "/");
  const segments = normalizedId.split("/").filter(Boolean);
  const lastSegment = segments.at(-1) ?? normalizedId;
  const fallbackBase =
    lastSegment.toLowerCase() === "index" && segments.length > 1
      ? segments.at(-2) ?? lastSegment
      : lastSegment;
  const fallbackSlug = normalizeSegment(fallbackBase);

  if (!fallbackSlug) {
    throw new Error(`Unable to derive blog slug from id: ${post.id}`);
  }

  return fallbackSlug;
};
