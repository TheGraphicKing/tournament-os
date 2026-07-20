import { redirect } from "next/navigation";

// The landing lives at "/"; /builder goes straight to the intake form.
export default function BuilderIndex() {
  redirect("/builder/intake");
}
