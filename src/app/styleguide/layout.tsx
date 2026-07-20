import { notFound } from "next/navigation";

/**
 * The styleguide is a developer-only component gallery (a QA/consistency
 * reference for building the UI), not a user-facing feature. It renders in
 * local development but 404s in the deployed app.
 */
export default function StyleguideLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
