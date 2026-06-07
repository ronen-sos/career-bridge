import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/session";

export default async function GoalsPage() {
  await requireAuth();
  redirect("/dashboard");
}
