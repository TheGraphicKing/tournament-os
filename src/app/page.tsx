import Link from "next/link";
import { redirect } from "next/navigation";
import { Palette } from "lucide-react";
import { getUser, getMemberships } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const user = await getUser();
  // Route signed-in organisers into the flow: dashboard if they have an org,
  // onboarding (Flow O) if they don't.
  if (user) {
    const memberships = await getMemberships();
    redirect(memberships.length > 0 ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1200px] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-[1.75rem] font-semibold">Tournament OS</h1>
      <p className="max-w-md text-text-muted">
        Foundation build — design system, data model, tenancy and auth are in.
        Product features land in the next phase.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/styleguide">
            <Palette aria-hidden /> Open the styleguide
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
