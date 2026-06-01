import { requireAuth } from "@/lib/session";
import { getOrCreateProfile } from "@/lib/profile/get-profile";
import { isContactComplete } from "@/lib/profile/contact-complete";
import {
  getResumeDailyUsage,
  listSavedResumes,
  RESUME_DAILY_LIMIT,
} from "@/lib/resume/daily-limit";
import {
  daysUntilResumeExpires,
  purgeExpiredResumes,
  RESUME_RETENTION_DAYS,
} from "@/lib/resume/retention";
import { ProfilePageClient } from "@/components/ProfilePageClient";

export default async function ProfilePage() {
  const session = await requireAuth();
  await purgeExpiredResumes(session.user.id);

  const [{ profile, workExperiences, education }, { remainingToday }, savedResumes] =
    await Promise.all([
      getOrCreateProfile(session.user.id),
      getResumeDailyUsage(session.user.id),
      listSavedResumes(session.user.id),
    ]);

  const serializedWork = workExperiences.map((w) => ({
    ...w,
    startDate: w.startDate.toISOString(),
    endDate: w.endDate?.toISOString() ?? null,
  }));

  const serializedEducation = education.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
  }));

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">
        My profile
      </h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:text-base">
        Build your complete work and education history, then generate tailored
        resumes for each job you apply to.
      </p>

      <div className="mt-6">
        <ProfilePageClient
          profile={profile}
          workExperiences={serializedWork}
          education={serializedEducation}
          remainingToday={remainingToday}
          dailyLimit={RESUME_DAILY_LIMIT}
          contactComplete={isContactComplete(profile)}
          savedResumes={savedResumes.map((r) => ({
            id: r.id,
            targetRole: r.targetRole,
            targetCompany: r.targetCompany,
            createdAt: r.createdAt.toISOString(),
            daysRemaining: daysUntilResumeExpires(r.createdAt),
          }))}
          resumeRetentionDays={RESUME_RETENTION_DAYS}
        />
      </div>
    </div>
  );
}
