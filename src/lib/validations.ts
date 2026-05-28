import { z } from "zod";

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

export const weeklyGoalSchema = z.object({
  weekStart: z.string().min(1),
  targetApplications: z.coerce.number().min(0).max(100),
  targetNetworking: z.coerce.number().min(0).max(100),
  targetHours: z.coerce.number().min(0).max(80),
  notes: z.string().optional(),
});

export const managerReviewSchema = z.object({
  activityId: z.string().min(1),
  managerNotes: z.string().optional(),
});
