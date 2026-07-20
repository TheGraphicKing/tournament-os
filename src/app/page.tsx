import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
    <main className="mx-auto flex min-h-dvh max-w-[1200px] flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="max-w-xl space-y-3">
        <h1 className="font-display text-[2rem] font-semibold leading-tight">
          Run your tournament, end to end.
        </h1>
        <p className="text-text-muted">
          Describe your event once and get a live website, an email campaign, and a marketing
          kit automatically. Then manage registrations and match day in one place.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild size="lg">
          <Link href="/builder">
            Build a tournament <ArrowRight aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Organiser sign in</Link>
        </Button>
      </div>
    </main>
  );
}
