"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

type SavedResume = {
  id: string;
  targetRole: string | null;
  targetCompany: string | null;
  createdAt: string;
  daysRemaining: number;
};

type SavedResumeDetail = SavedResume & {
  contentMarkdown: string;
};

type SavedResumesListProps = {
  initialResumes: SavedResume[];
  retentionDays: number;
};

export function SavedResumesList({
  initialResumes,
  retentionDays,
}: SavedResumesListProps) {
  const [resumes] = useState(initialResumes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SavedResumeDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resumeLabel(resume: SavedResume) {
    if (resume.targetRole && resume.targetCompany) {
      return `${resume.targetRole} at ${resume.targetCompany}`;
    }
    if (resume.targetRole) return resume.targetRole;
    if (resume.targetCompany) return resume.targetCompany;
    return "Tailored resume";
  }

  async function viewResume(id: string) {
    if (selectedId === id && detail) {
      setSelectedId(null);
      setDetail(null);
      return;
    }

    setLoadingId(id);
    setError(null);

    const res = await fetch(`/api/resume/${id}`);
    if (!res.ok) {
      setError("Could not load resume.");
      setLoadingId(null);
      return;
    }

    const data = await res.json();
    setSelectedId(id);
    setDetail({
      ...data,
      createdAt: data.createdAt,
    });
    setLoadingId(null);
  }

  async function exportDocx(id: string) {
    setExportingId(id);
    setError(null);

    const res = await fetch(`/api/resume/${id}`, { method: "POST" });
    if (!res.ok) {
      setError("Could not export resume.");
      setExportingId(null);
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
    setExportingId(null);
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <CardTitle>Saved resumes</CardTitle>
        <CardDescription>
          Generated resumes are saved here for {retentionDays} days so you can
          review and re-download them.
        </CardDescription>
        <p className="mt-4 text-sm text-stone-500">
          No saved resumes yet. Generate one above to get started.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Saved resumes</CardTitle>
      <CardDescription>
        Resumes are kept for {retentionDays} days, then removed automatically.
      </CardDescription>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 space-y-2">
        {resumes.map((resume) => {
          const isOpen = selectedId === resume.id;
          return (
            <li
              key={resume.id}
              className={cn(
                "rounded-xl border border-stone-200 bg-white",
                isOpen && "ring-1 ring-emerald-200",
              )}
            >
              <div className="flex items-start justify-between gap-3 px-3 py-3">
                <button
                  type="button"
                  onClick={() => viewResume(resume.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="font-medium text-stone-900">
                    {resumeLabel(resume)}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {formatDate(resume.createdAt)} · {resume.daysRemaining}{" "}
                    day{resume.daysRemaining === 1 ? "" : "s"} left
                  </p>
                </button>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={loadingId === resume.id}
                    onClick={() => viewResume(resume.id)}
                  >
                    <FileText className="mr-1 h-3.5 w-3.5" />
                    {loadingId === resume.id
                      ? "Loading…"
                      : isOpen
                        ? "Hide"
                        : "View"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={exportingId === resume.id}
                    onClick={() => exportDocx(resume.id)}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    {exportingId === resume.id ? "Exporting…" : ".docx"}
                  </Button>
                </div>
              </div>

              {isOpen && detail?.id === resume.id && (
                <div className="border-t border-stone-100 px-3 py-3">
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-3 font-sans text-sm leading-relaxed text-stone-800">
                    {detail.contentMarkdown}
                  </pre>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
