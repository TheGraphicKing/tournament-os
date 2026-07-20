import Link from "next/link";
import { ArrowLeft, Wand2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New tournament" };

/**
 * Placeholder for the tournament creation wizard (Flow A1) — built in the
 * next phase. Kept so the dashboard CTA/checklist links don't 404.
 * TODO(rizzfitt): replace with the WizardStepper-driven creation flow.
 */
export default async function NewTournamentPage() {
  await requireUser();
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col justify-center gap-4 p-6">
      <EmptyState
        icon={Wand2}
        title="The tournament creation wizard lands in the next phase."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft aria-hidden /> Back to dashboard
            </Link>
          </Button>
        }
      />
    </main>
  );
}
