import { z } from "zod";

import { isValidPhoneUS, normalizePhoneUS } from "@/lib/phone";
import { isValidLinkedInUrl, normalizeLinkedInUrl } from "@/lib/linkedin";

export const activitySchema = z.object({
  date: z.string().min(1),
  type: z.enum([
    "APPLICATION",
    "NETWORKING",
    "INTERVIEW",
    "RESEARCH",
    "TRAINING",
    "OTHER",
  ]),
  description: z.string().min(3, "Please add a brief description"),
  company: z.string().optional(),
  roleTitle: z.string().optional(),
  hoursSpent: z.coerce.number().min(0).max(24).default(0),
});

export const customGoalItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(3, "Describe the custom goal").max(200),
});

import { MIN_WEEKLY_HOURS } from "@/lib/goals/hours";

const hourTargetField = z.coerce.number().min(0).max(168);

export const weeklyGoalSchema = z
  .object({
    participantId: z.string().optional(),
    weekStart: z.string().min(1),
    targetApplications: z.coerce.number().min(0).max(100),
    targetInterviews: z.coerce.number().min(0).max(50),
    targetJobSeekingHours: hourTargetField,
    targetEmploymentHours: hourTargetField,
    targetEducationHours: hourTargetField,
    notes: z.string().max(1000).optional(),
    customItems: z
      .array(customGoalItemSchema)
      .max(10, "Maximum 10 custom goals per week")
      .optional(),
  })
  .refine(
    (data) =>
      data.targetJobSeekingHours +
        data.targetEmploymentHours +
        data.targetEducationHours >=
      MIN_WEEKLY_HOURS,
    {
      message: `Weekly hour targets must total at least ${MIN_WEEKLY_HOURS} hours`,
      path: ["targetJobSeekingHours"],
    },
  );

export const goalActionSchema = z.object({
  action: z.enum(["submit", "approve", "complete_week", "reopen"]),
  managerApprovalNotes: z.string().max(1000).optional(),
  weekReviewNotes: z.string().max(2000).optional(),
});

export const customCompletionSchema = z.object({
  customItemId: z.string().min(1),
  completed: z.boolean(),
});

export const dailyGoalUpdateSchema = z.object({
  date: z.string().min(1),
  applicationsCount: z.coerce.number().min(0).max(50),
  interviewsCount: z.coerce.number().min(0).max(20),
  jobSeekingHours: z.coerce.number().min(0).max(24),
  employmentHours: z.coerce.number().min(0).max(24),
  educationHours: z.coerce.number().min(0).max(24),
  notes: z
    .string()
    .min(10, "Add a brief reflection on what you accomplished today")
    .max(2000),
  customCompletions: z.array(customCompletionSchema).optional(),
});

export const dailyUpdateReviewSchema = z.object({
  managerNotes: z.string().max(1000).optional(),
});

export const managerReviewSchema = z.object({
  activityId: z.string().min(1),
  managerNotes: z.string().optional(),
});

export const createUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["PARTICIPANT", "MANAGER", "ADMIN"]),
  managerId: z.string().optional().nullable(),
  sendInvite: z.boolean().optional(),
  personalNote: z.string().max(500, "Keep your note under 500 characters").optional(),
});

export const resendInviteSchema = z.object({
  personalNote: z.string().max(500, "Keep your note under 500 characters").optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["PARTICIPANT", "MANAGER", "ADMIN"]).optional(),
  managerId: z.string().optional().nullable(),
});

const dateString = z.string().min(1, "Date is required");

const accomplishmentsSchema = z
  .array(z.string().min(10, "Add a bit more detail for each accomplishment (at least 10 characters)"))
  .min(1, "Describe at least one result or highlight from this experience")
  .max(10, "Maximum 10 accomplishments per entry");

export const profileSchema = z.object({
  headline: z.string().max(120).optional(),
  summary: z.string().max(5000).optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val?.trim() || isValidPhoneUS(val),
      "Enter a valid 10-digit US phone number",
    )
    .transform((val) => normalizePhoneUS(val)),
  location: z.string().max(120).optional(),
  linkedInUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val?.trim() || isValidLinkedInUrl(val),
      "Enter a valid LinkedIn profile URL (e.g. linkedin.com/in/yourname)",
    )
    .transform((val) => normalizeLinkedInUrl(val)),
});

export const workExperienceSchema = z
  .object({
    company: z.string().min(1, "Company name is required"),
    title: z.string().min(1, "Job title is required"),
    startDate: dateString,
    endDate: z.string().optional(),
    isCurrent: z.boolean().default(false),
    accomplishments: accomplishmentsSchema,
  })
  .refine(
    (data) => data.isCurrent || (data.endDate && data.endDate.length > 0),
    { message: "End date is required unless this is your current role", path: ["endDate"] },
  );

export const educationSchema = z
  .object({
    institution: z.string().min(1, "Institution name is required"),
    degree: z.string().min(1, "Degree or credential is required"),
    fieldOfStudy: z.string().optional(),
    startDate: dateString,
    endDate: z.string().optional(),
    isCurrent: z.boolean().default(false),
    accomplishments: accomplishmentsSchema,
  })
  .refine(
    (data) => data.isCurrent || (data.endDate && data.endDate.length > 0),
    { message: "End date is required unless currently enrolled", path: ["endDate"] },
  );

export const resumeGenerateSchema = z.object({
  jobDescription: z
    .string()
    .min(50, "Paste the full job description (at least 50 characters)")
    .max(15000, "Job description is too long"),
  targetRole: z.string().max(200).optional(),
  targetCompany: z.string().max(200).optional(),
});
