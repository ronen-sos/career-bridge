import { z } from "zod";

import { isValidPhoneUS, normalizePhoneUS } from "@/lib/phone";
import { isValidLinkedInUrl, normalizeLinkedInUrl } from "@/lib/linkedin";

export const activitySchema = z
  .object({
    date: z.string().min(1),
    type: z.enum([
      "APPLICATION",
      "NETWORKING",
      "INTERVIEW",
      "RESEARCH",
      "TRAINING",
      "OTHER",
    ]),
    description: z.string().optional(),
    company: z.string().optional(),
    roleTitle: z.string().optional(),
    companyId: z.string().optional(),
    positionId: z.string().optional(),
    allowSimilarCompanyOverride: z.boolean().optional(),
    hoursSpent: z.coerce.number().min(0).max(24).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "APPLICATION") {
      const hasCompany = Boolean(data.companyId?.trim() || data.company?.trim());
      const hasPosition = Boolean(data.roleTitle?.trim() || data.positionId?.trim());

      if (!hasCompany) {
        ctx.addIssue({
          code: "custom",
          message: "Company is required when logging an application",
          path: ["company"],
        });
      }

      if (!hasPosition) {
        ctx.addIssue({
          code: "custom",
          message: "Position is required when logging an application",
          path: ["roleTitle"],
        });
      }
      return;
    }

    const description = data.description?.trim() ?? "";
    if (description.length < 3) {
      ctx.addIssue({
        code: "custom",
        message: "Please add a brief description",
        path: ["description"],
      });
    }
  })
  .transform((data) => {
    const hoursSpent = data.hoursSpent ?? 0;

    if (data.type === "APPLICATION") {
      const companyName = data.company?.trim() || "company";
      const positionTitle = data.roleTitle?.trim() || "position";
      return {
        ...data,
        hoursSpent,
        description:
          data.description?.trim() ||
          `Applied for ${positionTitle} at ${companyName}`,
      };
    }

    return {
      ...data,
      hoursSpent,
      description: data.description!.trim(),
    };
  });

export const jobApplicationSchema = z
  .object({
    appliedAt: z.string().min(1),
    companyId: z.string().optional(),
    companyName: z.string().optional(),
    positionId: z.string().optional(),
    positionTitle: z.string().optional(),
    resumeGenerationId: z.string().optional(),
    allowSimilarCompanyOverride: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasCompany = Boolean(data.companyId?.trim() || data.companyName?.trim());
    const hasPosition = Boolean(
      data.positionId?.trim() || data.positionTitle?.trim(),
    );

    if (!hasCompany) {
      ctx.addIssue({
        code: "custom",
        message: "Company is required",
        path: ["companyName"],
      });
    }

    if (!hasPosition) {
      ctx.addIssue({
        code: "custom",
        message: "Position is required",
        path: ["positionTitle"],
      });
    }
  });

export const jobInterviewSchema = z
  .object({
    interviewedAt: z.string().min(1),
    linkType: z.enum([
      "LINKED_APPLICATION",
      "NO_PRIOR_APPLICATION",
      "RETROACTIVE_APPLICATION",
    ]),
    applicationId: z.string().optional(),
    companyId: z.string().optional(),
    companyName: z.string().optional(),
    positionId: z.string().optional(),
    positionTitle: z.string().optional(),
    appliedAt: z.string().optional(),
    allowSimilarCompanyOverride: z.boolean().optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.linkType === "LINKED_APPLICATION") {
      if (!data.applicationId?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Select an application for this interview",
          path: ["applicationId"],
        });
      }
      return;
    }

    const hasCompany = Boolean(data.companyId?.trim() || data.companyName?.trim());
    const hasPosition = Boolean(
      data.positionId?.trim() || data.positionTitle?.trim(),
    );

    if (!hasCompany) {
      ctx.addIssue({
        code: "custom",
        message: "Company is required",
        path: ["companyName"],
      });
    }

    if (!hasPosition) {
      ctx.addIssue({
        code: "custom",
        message: "Position is required",
        path: ["positionTitle"],
      });
    }

    if (data.linkType === "RETROACTIVE_APPLICATION" && !data.appliedAt?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Application date is required",
        path: ["appliedAt"],
      });
    }
  });

export const customGoalItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(3, "Describe the custom goal").max(200),
  expectedHours: z.coerce
    .number()
    .min(0.5, "Expected hours must be at least 0.5")
    .max(168, "Expected hours cannot exceed 168"),
});

const hourTargetField = z.coerce.number().min(0).max(168);

export const weeklyGoalSchema = z
  .object({
    participantId: z.string().min(1, "Participant is required"),
    weekStart: z.string().min(1),
    weekEnd: z.string().min(1),
    targetApplications: z.coerce.number().min(0).max(100),
    targetInterviews: z.coerce.number().min(0).max(50),
    targetEmploymentHours: hourTargetField,
    notes: z.string().max(1000).optional(),
    customItems: z
      .array(customGoalItemSchema)
      .max(10, "Maximum 10 custom goals per week")
      .optional(),
  })
  .refine(
    (data) => new Date(data.weekEnd) >= new Date(data.weekStart),
    {
      message: "End date must be on or after the start date",
      path: ["weekEnd"],
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
  employmentHours: z.coerce.number().min(0).max(24),
  notes: z
    .string()
    .min(10, "Add a brief reflection on what you accomplished today")
    .max(2000),
  customCompletions: z.array(customCompletionSchema).optional(),
});

export const dailyUpdateReviewSchema = z.object({
  managerNotes: z.string().max(1000).optional(),
});

export const participantQuestionSchema = z.object({
  question: z
    .string()
    .min(10, "Please write your question in a bit more detail")
    .max(2000),
});

export const questionReviewSchema = z.object({
  managerReply: z.string().max(2000).optional(),
});

export const markQuestionsReadSchema = z.object({
  questionIds: z.array(z.string().min(1)).optional(),
});

export const customCompletionToggleSchema = z.object({
  customItemId: z.string().min(1),
  completed: z.boolean(),
  date: z.string().min(1).optional(),
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
  /** Target organization — honored only for super admins. */
  organizationId: z.string().optional().nullable(),
  sendInvite: z.boolean().optional(),
  personalNote: z.string().max(500, "Keep your note under 500 characters").optional(),
});

export const resendInviteSchema = z.object({
  personalNote: z.string().max(500, "Keep your note under 500 characters").optional(),
});

export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(120, "Keep the name under 120 characters"),
});

export const createOrgAdminSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  name: z.string().min(1, "Name is required"),
  sendInvite: z.boolean().optional(),
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
  targetRole: z.string().min(1, "Position title is required").max(200),
  targetCompany: z.string().min(1, "Company name is required").max(200),
  companyId: z.string().optional(),
  positionId: z.string().optional(),
  allowSimilarCompanyOverride: z.boolean().optional(),
});
