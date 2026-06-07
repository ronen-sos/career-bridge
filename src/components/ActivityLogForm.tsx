"use client";

import { useState } from "react";
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

const ACTIVITY_TYPES = [
  { value: "APPLICATION", label: "Application submitted" },
  { value: "NETWORKING", label: "Networking / outreach" },
  { value: "RESEARCH", label: "Job research" },
  { value: "TRAINING", label: "Training / certification" },
  { value: "OTHER", label: "Other" },
] as const;

export function ActivityLogForm() {
  const router = useRouter();
  const progressBridge = useProgressBridge();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityType, setActivityType] = useState<string>("APPLICATION");
  const [company, setCompany] = useState<CompanySelection>({ name: "" });
  const [position, setPosition] = useState<PositionSelection>({ title: "" });
  const [similarOverride, setSimilarOverride] = useState(false);
  const [blockedBySimilarity, setBlockedBySimilarity] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const isApplication = activityType === "APPLICATION";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    setError(null);
    snapshotProgressBeforeActivity(progressBridge);

    if (isApplication && blockedBySimilarity) {
      setError(
        "Select an existing company or confirm adding a new company name.",
      );
      setLoading(false);
      return;
    }

    const form = new FormData(formEl);
    const payload = {
      date: form.get("date"),
      type: form.get("type"),
      ...(isApplication
        ? {}
        : { description: form.get("description") }),
      company: isApplication ? company.name : form.get("company") || undefined,
      roleTitle: isApplication
        ? position.title
        : form.get("roleTitle") || undefined,
      companyId: isApplication ? company.id : undefined,
      positionId: isApplication ? position.id : undefined,
      allowSimilarCompanyOverride: isApplication ? similarOverride : undefined,
      hoursSpent: isApplication ? 0 : form.get("hoursSpent") || 0,
    };

    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not save activity. Please try again.",
      );
      setLoading(false);
      return;
    }

    formEl.reset();
    setCompany({ name: "" });
    setPosition({ title: "" });
    setSimilarOverride(false);
    setActivityType("APPLICATION");
    setLoading(false);
    await finishActivityWithProgressCelebration(progressBridge, router);
  }

  return (
    <Card>
      <CardTitle>Log job search activity</CardTitle>
      <CardDescription>
        Record networking, research, training, and other job search activities.
        Use the interview form above to log interviews.
      </CardDescription>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="mb-1 block text-sm font-medium text-stone-700">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={today}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>

          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium text-stone-700">
              Activity type
            </label>
            <select
              id="type"
              name="type"
              required
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isApplication ? (
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
        ) : (
          <>
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-stone-700">
                What did you do?
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                placeholder="e.g. Researched local employers, attended a job fair"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="company" className="mb-1 block text-sm font-medium text-stone-700">
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                placeholder="Optional"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
            </div>
            <div>
              <label htmlFor="roleTitle" className="mb-1 block text-sm font-medium text-stone-700">
                Role
              </label>
              <input
                id="roleTitle"
                name="roleTitle"
                type="text"
                placeholder="Optional"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
            </div>
          </div>
          </>
        )}

        {!isApplication && (
          <div>
            <label htmlFor="hoursSpent" className="mb-1 block text-sm font-medium text-stone-700">
              Hours spent
            </label>
            <input
              id="hoursSpent"
              name="hoursSpent"
              type="number"
              min={0}
              max={24}
              step={0.5}
              defaultValue={1}
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Saving…" : isApplication ? "Save application" : "Save activity"}
        </Button>
      </form>
    </Card>
  );
}
