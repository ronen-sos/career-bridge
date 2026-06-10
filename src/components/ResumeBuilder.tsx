"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, FileText, Search, Sparkles } from "lucide-react";

import {
  CompanyPicker,
  type CompanySelection,
} from "@/components/applications/CompanyPicker";
import {
  PositionPicker,
  type PositionSelection,
} from "@/components/applications/PositionPicker";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";

type ResumeHistoryItem = {
  id: string;
  targetRole: string | null;
  targetCompany: string | null;
  createdAt: string;
  application: { id: string; appliedAt: string } | null;
};

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
  const [company, setCompany] = useState<CompanySelection>({ name: "" });
  const [position, setPosition] = useState<PositionSelection>({ title: "" });
  const [similarOverride, setSimilarOverride] = useState(false);
  const [blockedBySimilarity, setBlockedBySimilarity] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeHistory, setResumeHistory] = useState<ResumeHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(
    null,
  );
  const [markApplied, setMarkApplied] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [recordingApplication, setRecordingApplication] = useState(false);

  const hasProfileData = workCount > 0 || educationCount > 0;
  const atDailyLimit = remainingToday <= 0;
  const canGenerate =
    jobDescription.length >= 50 &&
    company.name.trim().length > 0 &&
    position.title.trim().length > 0 &&
    !blockedBySimilarity;

  useEffect(() => {
    if (!position.id) {
      setResumeHistory([]);
      return;
    }

    const controller = new AbortController();
    setHistoryLoading(true);

    fetch(`/api/resume/history?positionId=${position.id}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setResumeHistory(data.resumes ?? []);
      })
      .finally(() => setHistoryLoading(false));

    return () => controller.abort();
  }, [position.id]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAppliedSuccess(false);
    setGeneratedResumeId(null);
    setMarkApplied(false);

    const res = await fetch("/api/resume/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription,
        targetRole: position.title,
        targetCompany: company.name,
        companyId: company.id,
        positionId: position.id,
        allowSimilarCompanyOverride: similarOverride,
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
    const resumeId = res.headers.get("X-Resume-Id");
    const positionId = res.headers.get("X-Position-Id");
    const companyId = res.headers.get("X-Company-Id");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (companyId && !company.id) {
      setCompany((current) => ({ ...current, id: companyId }));
    }
    if (positionId && !position.id) {
      setPosition((current) => ({ ...current, id: positionId }));
    }
    if (resumeId) {
      setGeneratedResumeId(resumeId);
    }

    setRemainingToday((n) => Math.max(0, n - 1));
    setLoading(false);
    router.refresh();
  }

  async function handleRecordApplication() {
    if (!markApplied) return;

    setRecordingApplication(true);
    setError(null);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appliedAt: new Date().toISOString().split("T")[0],
        companyId: company.id,
        companyName: company.name,
        positionId: position.id,
        positionTitle: position.title,
        resumeGenerationId: generatedResumeId ?? undefined,
        allowSimilarCompanyOverride: similarOverride,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not record application.",
      );
      setRecordingApplication(false);
      return;
    }

    setAppliedSuccess(true);
    setRecordingApplication(false);
    router.refresh();

    if (position.id) {
      const historyRes = await fetch(
        `/api/resume/history?positionId=${position.id}`,
      );
      if (historyRes.ok) {
        const data = await historyRes.json();
        setResumeHistory(data.resumes ?? []);
      }
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-100 p-2">
          <Sparkles className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <CardTitle>Build a tailored resume</CardTitle>
          <CardDescription>
            Start from a real job posting you found online. We&apos;ll use it
            to create a resume tailored to that exact role. It downloads as
            .docx and is saved here for 60 days.
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
            generations. Your limit resets at midnight UTC — try again
            tomorrow.
          </p>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="mt-4 space-y-4">
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-sky-100 p-2">
                <Search className="h-4 w-4 text-sky-700" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-sky-950">
                  First, find a job posting online
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-sky-900">
                  <li>
                    Search a job site like Indeed, LinkedIn, or a company&apos;s
                    careers page for a job you want to apply to.
                  </li>
                  <li>
                    Enter that job&apos;s <strong>company name</strong> and{" "}
                    <strong>job title</strong> in the fields below.
                  </li>
                  <li>
                    Copy the <strong>full job description</strong> from the
                    posting and paste it in the box at the bottom.
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CompanyPicker
              value={company}
              onChange={(next) => {
                setCompany(next);
                setPosition({ title: "" });
              }}
              similarOverride={similarOverride}
              onSimilarityOverrideChange={setSimilarOverride}
              onSimilarityWarningChange={setBlockedBySimilarity}
              required
            />
            <PositionPicker
              companyId={company.id}
              companySelected={company.name.trim().length > 0}
              value={position}
              onChange={setPosition}
              required
            />
          </div>

          {position.id && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-medium text-stone-900">
                Resume history for this role
              </p>
              {historyLoading ? (
                <p className="mt-2 text-sm text-stone-500">Loading history…</p>
              ) : resumeHistory.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500">
                  No saved resumes for this position yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {resumeHistory.map((resume) => (
                    <li
                      key={resume.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                    >
                      <span className="text-stone-700">
                        {formatDate(resume.createdAt)}
                      </span>
                      {resume.application ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Applied {formatDate(resume.application.appliedAt)}
                        </span>
                      ) : (
                        <span className="text-stone-500">Not marked applied</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="jobDescription"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Job description{" "}
              <span className="font-normal text-stone-500">
                (copied from the job posting)
              </span>
            </label>
            <textarea
              id="jobDescription"
              required
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description from the posting here — include responsibilities, requirements, and qualifications…"
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
            <p className="mt-1 text-xs text-stone-500">
              {jobDescription.length} characters (minimum 50). The more of the
              posting you paste, the better the resume matches the job.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={loading || !canGenerate}
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

          {generatedResumeId && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-950">
                Resume downloaded
              </p>
              <p className="mt-1 text-sm text-emerald-900">
                When you submit the application, tick the box below to count it
                toward your weekly goal and show it on your dashboard.
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm text-emerald-950">
                <input
                  type="checkbox"
                  checked={markApplied}
                  onChange={(e) => setMarkApplied(e.target.checked)}
                  className="mt-0.5"
                />
                <span>I submitted this application</span>
              </label>
              {markApplied && !appliedSuccess && (
                <Button
                  type="button"
                  className="mt-3"
                  disabled={recordingApplication}
                  onClick={handleRecordApplication}
                >
                  {recordingApplication ? "Saving…" : "Record application"}
                </Button>
              )}
              {appliedSuccess && (
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Application recorded — nice work!
                </p>
              )}
            </div>
          )}
        </form>
      )}
    </Card>
  );
}
