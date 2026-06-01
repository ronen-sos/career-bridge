"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { displayPhoneUS, formatPhoneUS, isValidPhoneUS } from "@/lib/phone";

type ProfileData = {
  headline?: string | null;
  summary?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedInUrl?: string | null;
};

type ProfileBasicsFormProps = {
  profile: ProfileData;
  onContactComplete?: () => void;
};

function RequiredMark() {
  return <span className="text-red-600"> *</span>;
}

function formatProfileErrors(error: Record<string, string[] | undefined>): string | null {
  for (const messages of Object.values(error)) {
    if (messages?.[0]) return messages[0];
  }
  return null;
}

export function ProfileBasicsForm({
  profile,
  onContactComplete,
}: ProfileBasicsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState(() => displayPhoneUS(profile.phone));
  const [location, setLocation] = useState(profile.location ?? "");
  const [linkedInUrl, setLinkedInUrl] = useState(profile.linkedInUrl ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [summary, setSummary] = useState(profile.summary ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const trimmedPhone = phone.trim();
    const trimmedLocation = location.trim();
    const trimmedHeadline = headline.trim();
    const trimmedSummary = summary.trim();

    if (!trimmedPhone || !isValidPhoneUS(trimmedPhone)) {
      setError("A valid 10-digit phone number is required.");
      setLoading(false);
      return;
    }

    if (!trimmedLocation) {
      setError("Location is required.");
      setLoading(false);
      return;
    }

    if (!trimmedHeadline) {
      setError("Professional headline is required.");
      setLoading(false);
      return;
    }

    if (!trimmedSummary) {
      setError("Professional summary is required.");
      setLoading(false);
      return;
    }

    const payload = {
      headline: trimmedHeadline,
      summary: trimmedSummary,
      phone: formatPhoneUS(trimmedPhone),
      location: trimmedLocation,
      linkedInUrl: linkedInUrl.trim() || undefined,
    };

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const fieldError =
        typeof data.error === "object" && data.error !== null
          ? formatProfileErrors(data.error as Record<string, string[] | undefined>)
          : null;
      setError(
        fieldError ??
          (typeof data.error === "string"
            ? data.error
            : "Could not save profile. Please try again."),
      );
      setLoading(false);
      return;
    }

    setPhone(payload.phone);
    setSaved(true);
    setLoading(false);
    router.refresh();
    onContactComplete?.();
  }

  return (
    <Card>
      <CardTitle>Contact & summary</CardTitle>
      <CardDescription>
        Complete this section first. Phone, location, headline, and summary are
        required before you can add work history, education, or build resumes.
      </CardDescription>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-stone-700">
              Phone
              <RequiredMark />
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(formatPhoneUS(e.target.value))}
              placeholder="(555) 123-4567"
              maxLength={14}
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-medium text-stone-700">
              Location
              <RequiredMark />
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="linkedInUrl"
            className="mb-1 block text-sm font-medium text-stone-700"
          >
            LinkedIn profile
          </label>
          <input
            id="linkedInUrl"
            name="linkedInUrl"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={linkedInUrl}
            onChange={(e) => setLinkedInUrl(e.target.value)}
            placeholder="linkedin.com/in/yourname"
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
          />
        </div>

        <div>
          <label htmlFor="headline" className="mb-1 block text-sm font-medium text-stone-700">
            Professional headline
            <RequiredMark />
          </label>
          <input
            id="headline"
            name="headline"
            type="text"
            required
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Customer Service Professional | Team Leader"
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
          />
        </div>

        <div>
          <label htmlFor="summary" className="mb-1 block text-sm font-medium text-stone-700">
            Professional summary
            <RequiredMark />
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={4}
            required
            maxLength={5000}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A brief overview of your strengths and career goals…"
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
          />
          <p className="mt-1 text-xs text-stone-500">
            {summary.length}/5000 characters
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && (
          <p className="text-sm text-emerald-700">
            Contact saved — you can now complete work history, education, and
            resumes.
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Saving…" : "Save contact"}
        </Button>
      </form>
    </Card>
  );
}
