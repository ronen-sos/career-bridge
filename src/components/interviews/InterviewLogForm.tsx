"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
import { useProgressBridge } from "@/components/goals/ProgressBridgeProvider";
import {
  finishActivityWithProgressCelebration,
  snapshotProgressBeforeActivity,
} from "@/lib/goals/after-activity-progress";
import { formatDate } from "@/lib/format";

type ApplicationOption = {
  id: string;
  appliedAt: string;
  company: { id: string; name: string };
  position: { id: string; title: string };
  interviews: Array<{ id: string; interviewedAt: string }>;
};

type LinkMode =
  | "LINKED_APPLICATION"
  | "NO_PRIOR_APPLICATION"
  | "RETROACTIVE_APPLICATION"
  | null;

export function InterviewLogForm() {
  const router = useRouter();
  const progressBridge = useProgressBridge();
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [linkMode, setLinkMode] = useState<LinkMode>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [company, setCompany] = useState<CompanySelection>({ name: "" });
  const [position, setPosition] = useState<PositionSelection>({ title: "" });
  const [similarOverride, setSimilarOverride] = useState(false);
  const [blockedBySimilarity, setBlockedBySimilarity] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/interviews")
      .then((res) => res.json())
      .then((data) => setApplications(data.applications ?? []))
      .finally(() => setLoadingApps(false));
  }, []);

  function resetCompanyPosition() {
    setCompany({ name: "" });
    setPosition({ title: "" });
    setSimilarOverride(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;

    if (!linkMode) {
      setError("Choose how this interview relates to your applications.");
      return;
    }

    if (
      (linkMode === "NO_PRIOR_APPLICATION" ||
        linkMode === "RETROACTIVE_APPLICATION") &&
      blockedBySimilarity
    ) {
      setError(
        "Select an existing company or confirm adding a new company name.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    snapshotProgressBeforeActivity(progressBridge);

    const form = new FormData(formEl);
    const payload = {
      interviewedAt: form.get("interviewedAt"),
      linkType: linkMode,
      applicationId:
        linkMode === "LINKED_APPLICATION" ? selectedApplicationId : undefined,
      companyId: linkMode !== "LINKED_APPLICATION" ? company.id : undefined,
      companyName: linkMode !== "LINKED_APPLICATION" ? company.name : undefined,
      positionId: linkMode !== "LINKED_APPLICATION" ? position.id : undefined,
      positionTitle:
        linkMode !== "LINKED_APPLICATION" ? position.title : undefined,
      appliedAt:
        linkMode === "RETROACTIVE_APPLICATION"
          ? form.get("appliedAt")
          : undefined,
      allowSimilarCompanyOverride: similarOverride,
      notes: form.get("notes") || undefined,
    };

    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not save interview. Please try again.",
      );
      setLoading(false);
      return;
    }

    formEl.reset();
    setLinkMode(null);
    setSelectedApplicationId("");
    resetCompanyPosition();
    setLoading(false);

    await finishActivityWithProgressCelebration(progressBridge, router);

    fetch("/api/interviews")
      .then((res) => res.json())
      .then((data) => setApplications(data.applications ?? []));
  }

  return (
    <Card>
      <CardTitle>Log interview</CardTitle>
      <CardDescription>
        Link this interview to a job you applied for so we can track which
        employers follow through. If you didn&apos;t apply through Career Path,
        you can still log the interview without counting it as an application.
      </CardDescription>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-stone-800">
            Which job is this interview for?
          </legend>

          {loadingApps ? (
            <p className="text-sm text-stone-500">Loading your applications…</p>
          ) : (
            <ul className="space-y-2">
              {applications.map((application) => (
                <li key={application.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3 has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50">
                    <input
                      type="radio"
                      name="applicationChoice"
                      value={application.id}
                      checked={
                        linkMode === "LINKED_APPLICATION" &&
                        selectedApplicationId === application.id
                      }
                      onChange={() => {
                        setLinkMode("LINKED_APPLICATION");
                        setSelectedApplicationId(application.id);
                        resetCompanyPosition();
                      }}
                      className="mt-1"
                    />
                    <span className="text-sm">
                      <span className="font-medium text-stone-900">
                        {application.position.title} at {application.company.name}
                      </span>
                      <span className="mt-0.5 block text-stone-500">
                        Applied {formatDate(application.appliedAt)}
                        {application.interviews.length > 0 &&
                          ` · ${application.interviews.length} interview${application.interviews.length === 1 ? "" : "s"} logged`}
                      </span>
                    </span>
                  </label>
                </li>
              ))}

              <li>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3 has-[:checked]:border-amber-300 has-[:checked]:bg-amber-50">
                  <input
                    type="radio"
                    name="applicationChoice"
                    checked={linkMode === "NO_PRIOR_APPLICATION"}
                    onChange={() => {
                      setLinkMode("NO_PRIOR_APPLICATION");
                      setSelectedApplicationId("");
                      resetCompanyPosition();
                    }}
                    className="mt-1"
                  />
                  <span className="text-sm font-medium text-stone-900">
                    I didn&apos;t apply for the job
                  </span>
                </label>
              </li>

              <li>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3 has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50">
                  <input
                    type="radio"
                    name="applicationChoice"
                    checked={linkMode === "RETROACTIVE_APPLICATION"}
                    onChange={() => {
                      setLinkMode("RETROACTIVE_APPLICATION");
                      setSelectedApplicationId("");
                      resetCompanyPosition();
                    }}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-stone-900">
                      I forgot to log my application
                    </span>
                    <span className="mt-0.5 block text-stone-500">
                      We&apos;ll add the application and link this interview.
                    </span>
                  </span>
                </label>
              </li>
            </ul>
          )}
        </fieldset>

        {(linkMode === "NO_PRIOR_APPLICATION" ||
          linkMode === "RETROACTIVE_APPLICATION") && (
          <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
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

            {linkMode === "RETROACTIVE_APPLICATION" && (
              <div>
                <label
                  htmlFor="appliedAt"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
                  When did you apply?
                </label>
                <input
                  id="appliedAt"
                  name="appliedAt"
                  type="date"
                  max={today}
                  required
                  className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base sm:max-w-xs"
                />
              </div>
            )}
          </div>
        )}

        {linkMode && (
          <>
            <div>
              <label
                htmlFor="interviewedAt"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Interview date
              </label>
              <input
                id="interviewedAt"
                name="interviewedAt"
                type="date"
                defaultValue={today}
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base sm:max-w-xs"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="e.g. Phone screen with hiring manager, next step is onsite"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading || !linkMode}
          className="w-full sm:w-auto"
        >
          {loading ? "Saving…" : "Save interview"}
        </Button>
      </form>
    </Card>
  );
}
