/**
 * Slugify a display name into a URL-safe slug (lowercase, hyphenated).
 * The DB still dedupes under the unique constraint (create_organisation),
 * so this is a best-effort base — collisions are resolved server-side.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}
