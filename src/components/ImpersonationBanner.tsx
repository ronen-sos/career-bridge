"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

export function ImpersonationBanner({
  userName,
  superAdminEmail,
}: {
  userName: string;
  superAdminEmail: string;
}) {
  const [stopping, setStopping] = useState(false);

  async function stopImpersonating() {
    setStopping(true);
    await fetch("/api/super-admin/impersonate", { method: "DELETE" });
    window.location.href = "/admin";
  }

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-md">
      <span className="inline-flex items-center gap-1.5">
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        Viewing as <strong>{userName}</strong> ({superAdminEmail})
      </span>
      <button
        type="button"
        onClick={stopImpersonating}
        disabled={stopping}
        className="rounded-lg bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 transition-colors hover:bg-amber-900 disabled:opacity-60"
      >
        {stopping ? "Returning…" : "Return to my account"}
      </button>
    </div>
  );
}
