import { IntakeForm } from "./intake-form";

export const metadata = { title: "Describe your tournament" };

export default function IntakePage() {
  return (
    <main className="flex min-h-dvh justify-center bg-background p-4 sm:p-8">
      <IntakeForm />
    </main>
  );
}
