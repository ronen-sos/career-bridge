"use client";

import { useState } from "react";
import { Briefcase, FileText, GraduationCap, Lock, User } from "lucide-react";

import { EducationSection, type EducationItem } from "@/components/EducationSection";
import { ProfileBasicsForm } from "@/components/ProfileBasicsForm";
import { ResumeBuilder } from "@/components/ResumeBuilder";
import { SavedResumesList } from "@/components/SavedResumesList";
import {
  WorkExperienceSection,
  type WorkExperienceItem,
} from "@/components/WorkExperienceSection";
import { cn } from "@/lib/cn";
import { CONTACT_REQUIRED_MESSAGE } from "@/lib/profile/contact-complete";

type Tab = "basics" | "work" | "education" | "resume";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "basics", label: "Contact", icon: User },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "resume", label: "Resume", icon: FileText },
];

type SavedResumeItem = {
  id: string;
  targetRole: string | null;
  targetCompany: string | null;
  createdAt: string;
  daysRemaining: number;
};

type ProfilePageClientProps = {
  profile: {
    headline?: string | null;
    summary?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedInUrl?: string | null;
  };
  workExperiences: WorkExperienceItem[];
  education: EducationItem[];
  remainingToday: number;
  dailyLimit: number;
  contactComplete: boolean;
  savedResumes: SavedResumeItem[];
  resumeRetentionDays: number;
};

export function ProfilePageClient({
  profile,
  workExperiences,
  education,
  remainingToday,
  dailyLimit,
  contactComplete,
  savedResumes,
  resumeRetentionDays,
}: ProfilePageClientProps) {
  const [tab, setTab] = useState<Tab>(contactComplete ? "work" : "basics");

  function selectTab(next: Tab) {
    if (next !== "basics" && !contactComplete) return;
    setTab(next);
  }

  return (
    <div>
      {!contactComplete && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {CONTACT_REQUIRED_MESSAGE} Start on the Contact tab — phone, location,
          headline, and summary are required.
        </div>
      )}

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-stone-100 p-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const locked = id !== "basics" && !contactComplete;

          return (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              disabled={locked}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                tab === id
                  ? "bg-white text-emerald-800 shadow-sm"
                  : locked
                    ? "cursor-not-allowed text-stone-400"
                    : "text-stone-600 hover:text-stone-900",
              )}
            >
              {locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {tab === "basics" && (
        <ProfileBasicsForm
          profile={profile}
          onContactComplete={() => setTab("work")}
        />
      )}

      {tab === "work" && contactComplete && (
        <WorkExperienceSection experiences={workExperiences} />
      )}

      {tab === "education" && contactComplete && (
        <EducationSection education={education} />
      )}

      {tab === "resume" && contactComplete && (
        <div className="space-y-6">
          <ResumeBuilder
            workCount={workExperiences.length}
            educationCount={education.length}
            remainingToday={remainingToday}
            dailyLimit={dailyLimit}
          />
          <SavedResumesList
            initialResumes={savedResumes}
            retentionDays={resumeRetentionDays}
          />
        </div>
      )}
    </div>
  );
}
