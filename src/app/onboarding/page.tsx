import { redirect } from "next/navigation";
import { requireUser, getProfile, getMemberships } from "@/lib/auth/session";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata = { title: "Get started" };

/**
 * Flow O — onboarding. Guards: must be signed in; if the user already
 * owns/belongs to an org, they've finished onboarding → dashboard.
 */
export default async function OnboardingPage() {
  await requireUser();
  const memberships = await getMemberships();
  if (memberships.length > 0) redirect("/dashboard");

  const profile = await getProfile();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <OnboardingWizard initialName={profile?.name ?? ""} />
    </main>
  );
}
