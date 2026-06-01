import Link from "next/link";
import { ArrowLeft, Briefcase, FileText, GraduationCap, User } from "lucide-react";

import { ActivityList } from "@/components/ActivityList";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { isContactComplete } from "@/lib/profile/contact-complete";
import { displayLinkedInUrl } from "@/lib/linkedin";
import { displayPhoneUS } from "@/lib/phone";
import { formatDate, formatDateRange } from "@/lib/format";

type ParticipantOverviewProps = {
  participant: {
    id: string;
    name: string;
    email: string;
    profile: {
      headline: string | null;
      summary: string | null;
      phone: string | null;
      location: string | null;
      linkedInUrl: string | null;
    } | null;
    workExperiences: Array<{
      id: string;
      company: string;
      title: string;
      startDate: Date;
      endDate: Date | null;
      isCurrent: boolean;
      accomplishments: string[];
    }>;
    education: Array<{
      id: string;
      institution: string;
      degree: string;
      fieldOfStudy: string | null;
      startDate: Date;
      endDate: Date | null;
      isCurrent: boolean;
      accomplishments: string[];
    }>;
    activities: Array<{
      id: string;
      date: Date;
      type: string;
      description: string;
      company: string | null;
      roleTitle: string | null;
      hoursSpent: number;
      managerReviewed: boolean;
      managerNotes: string | null;
    }>;
    resumeGenerations: Array<{
      id: string;
      targetRole: string | null;
      targetCompany: string | null;
      createdAt: Date;
    }>;
  };
};

export function ParticipantOverview({ participant }: ParticipantOverviewProps) {
  const profile = participant.profile;
  const contactComplete = isContactComplete(profile);
  const applications = participant.activities.filter(
    (a) => a.type === "APPLICATION",
  );

  return (
    <div>
      <Link
        href="/manager"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to team
      </Link>

      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">
        {participant.name}
      </h1>
      <p className="mt-1 text-sm text-stone-600 md:text-base">
        {participant.email}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            contactComplete
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          Profile {contactComplete ? "complete" : "incomplete"}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {applications.length} application
          {applications.length === 1 ? "" : "s"} logged
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {participant.resumeGenerations.length} resume
          {participant.resumeGenerations.length === 1 ? "" : "s"} generated
        </span>
      </div>

      <div className="mt-6 space-y-6">
        <Card>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-700" />
            <CardTitle>Contact & summary</CardTitle>
          </div>
          {!profile || !contactComplete ? (
            <CardDescription className="mt-2">
              This participant has not completed their contact profile yet.
            </CardDescription>
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              {profile.phone && (
                <div>
                  <dt className="font-medium text-stone-700">Phone</dt>
                  <dd className="text-stone-600">{displayPhoneUS(profile.phone)}</dd>
                </div>
              )}
              {profile.location && (
                <div>
                  <dt className="font-medium text-stone-700">Location</dt>
                  <dd className="text-stone-600">{profile.location}</dd>
                </div>
              )}
              {profile.linkedInUrl && (
                <div>
                  <dt className="font-medium text-stone-700">LinkedIn</dt>
                  <dd>
                    <a
                      href={profile.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-800 underline"
                    >
                      {displayLinkedInUrl(profile.linkedInUrl)}
                    </a>
                  </dd>
                </div>
              )}
              {profile.headline && (
                <div>
                  <dt className="font-medium text-stone-700">Headline</dt>
                  <dd className="text-stone-600">{profile.headline}</dd>
                </div>
              )}
              {profile.summary && (
                <div>
                  <dt className="font-medium text-stone-700">Summary</dt>
                  <dd className="whitespace-pre-wrap text-stone-600">
                    {profile.summary}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-700" />
            <CardTitle>Work history</CardTitle>
          </div>
          {participant.workExperiences.length === 0 ? (
            <CardDescription className="mt-2">No work history added yet.</CardDescription>
          ) : (
            <ul className="mt-4 space-y-3">
              {participant.workExperiences.map((exp) => (
                <li
                  key={exp.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <h4 className="font-semibold text-stone-900">{exp.title}</h4>
                  <p className="text-sm text-stone-600">{exp.company}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {exp.accomplishments.map((item, i) => (
                      <li key={i} className="text-sm text-stone-700">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-700" />
            <CardTitle>Education</CardTitle>
          </div>
          {participant.education.length === 0 ? (
            <CardDescription className="mt-2">No education added yet.</CardDescription>
          ) : (
            <ul className="mt-4 space-y-3">
              {participant.education.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <h4 className="font-semibold text-stone-900">
                    {entry.degree}
                    {entry.fieldOfStudy && (
                      <span className="font-normal text-stone-600">
                        {" "}
                        in {entry.fieldOfStudy}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-stone-600">{entry.institution}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {formatDateRange(entry.startDate, entry.endDate, entry.isCurrent)}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {entry.accomplishments.map((item, i) => (
                      <li key={i} className="text-sm text-stone-700">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-700" />
            <CardTitle>Applications</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Job applications this participant has logged.
          </CardDescription>
          <div className="mt-4">
            {applications.length === 0 ? (
              <p className="text-sm text-stone-500">No applications logged yet.</p>
            ) : (
              <ActivityList activities={applications} />
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>All job search activity</CardTitle>
          <CardDescription className="mt-1">
            Full activity log including networking, interviews, and research.
          </CardDescription>
          <div className="mt-4">
            <ActivityList activities={participant.activities} />
          </div>
        </Card>

        <Card>
          <CardTitle>Resume generation</CardTitle>
          <CardDescription className="mt-1">
            Resumes from the last 60 days. Older versions are removed
            automatically.
          </CardDescription>
          {participant.resumeGenerations.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              No resumes generated yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {participant.resumeGenerations.map((gen) => (
                <li
                  key={gen.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-stone-900">
                      {gen.targetRole ?? "Tailored resume"}
                      {gen.targetCompany && (
                        <span className="font-normal text-stone-600">
                          {" "}
                          at {gen.targetCompany}
                        </span>
                      )}
                    </p>
                    {!gen.targetRole && !gen.targetCompany && (
                      <p className="text-stone-600">General tailored resume</p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-stone-500">
                    {formatDate(gen.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
