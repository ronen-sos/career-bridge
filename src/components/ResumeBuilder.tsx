"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

type ResumeBuilderProps = {
  workCount: number;
  educationCount: number;
  remainingToday: number;
  dailyLimit: number;
};

export function ResumeBuilder({
  workCount,
  educationCount,
  remainingToday: initialRemaining,
  dailyLimit,
}: ResumeBuilderProps) {
  const router = useRouter();
  const [remainingToday, setRemainingToday] = useState(initialRemaining);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasProfileData = workCount > 0 || educationCount > 0;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/resume/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription,
        targetRole: targetRole || undefined,
        targetCompany: targetCompany || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not generate resume. Please try again.",
      );
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] ?? "resume.docx";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setRemainingToday((n) => Math.max(0, n - 1));
    setLoading(false);
    router.refresh();
  }

  const atDailyLimit = remainingToday <= 0;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-100 p-2">
          <Sparkles className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <CardTitle>Build a tailored resume</CardTitle>
          <CardDescription>
            Paste a job description and we&apos;ll create a tailored resume
            optimized for that role. It downloads as .docx and is saved here
            for 60 days.
            {hasProfileData && (
              <>
                {" "}
                {remainingToday} of {dailyLimit} generations remaining today.
              </>
            )}
          </CardDescription>
        </div>
      </div>

      {!hasProfileData ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              Add your work history and education first. The more detailed your
              accomplishments, the stronger your tailored resume will be.
            </p>
          </div>
        </div>
      ) : atDailyLimit ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            You&apos;ve reached the daily limit of {dailyLimit} resume
            generations. Your limit resets at midnight UTC — try again tomorrow.
          </p>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="targetRole"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Target role (optional)
              </label>
              <input
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Customer Service Representative"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
            </div>
            <div>
              <label
                htmlFor="targetCompany"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Target company (optional)
              </label>
              <input
                id="targetCompany"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Amazon"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="jobDescription"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Job description
            </label>
            <textarea
              id="jobDescription"
              required
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting here — include responsibilities, requirements, and qualifications…"
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
            <p className="mt-1 text-xs text-stone-500">
              {jobDescription.length} characters (minimum 50)
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={loading || jobDescription.length < 50}
            className="w-full sm:w-auto"
          >
            {loading ? (
              "Generating resume…"
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download tailored resume (.docx)
              </>
            )}
          </Button>
        </form>
      )}
    </Card>
  );
}
