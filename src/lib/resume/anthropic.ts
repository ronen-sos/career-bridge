import Anthropic from "@anthropic-ai/sdk";

import type { Education, Profile, WorkExperience } from "@/generated/prisma/client";
import { displayPhoneUS } from "@/lib/phone";
import { displayLinkedInUrl } from "@/lib/linkedin";

export type TailoredResume = {
  headline: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    dates: string;
    details: string;
  }[];
};

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

function formatDateRange(
  start: Date,
  end: Date | null,
  isCurrent: boolean,
): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const endLabel = isCurrent || !end ? "Present" : fmt(end);
  return `${fmt(start)} – ${endLabel}`;
}

function buildProfileContext(
  name: string,
  profile: Profile,
  work: WorkExperience[],
  education: Education[],
): string {
  const workBlock = work
    .map(
      (w) =>
        `- ${w.title} at ${w.company} (${formatDateRange(w.startDate, w.endDate, w.isCurrent)})\n  Accomplishments:\n${w.accomplishments.map((a) => `  • ${a}`).join("\n")}`,
    )
    .join("\n\n");

  const eduBlock = education
    .map(
      (e) =>
        `- ${e.degree}${e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ""} at ${e.institution} (${formatDateRange(e.startDate, e.endDate, e.isCurrent)})\n  Highlights:\n${e.accomplishments.map((a) => `  • ${a}`).join("\n")}`,
    )
    .join("\n\n");

  return `
CANDIDATE: ${name}
${profile.headline ? `HEADLINE: ${profile.headline}` : ""}
${profile.location ? `LOCATION: ${profile.location}` : ""}
${profile.phone ? `PHONE: ${displayPhoneUS(profile.phone)}` : ""}
${profile.linkedInUrl ? `LINKEDIN: ${displayLinkedInUrl(profile.linkedInUrl)}` : ""}
${profile.summary ? `SUMMARY: ${profile.summary}` : ""}

WORK HISTORY:
${workBlock || "(none provided)"}

EDUCATION:
${eduBlock || "(none provided)"}
`.trim();
}

const RESUME_JSON_SCHEMA = `{
  "headline": "string — targeted professional headline for this role",
  "summary": "string — 2-3 sentence professional summary tailored to the job",
  "skills": ["string array of 8-12 relevant skills"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "dates": "string e.g. Jan 2020 – Present",
      "bullets": ["outcome-oriented bullet points, max 5 per role, most relevant first"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "dates": "string",
      "details": "string — brief relevant highlights"
    }
  ]
}`;

export async function generateTailoredResume(
  name: string,
  profile: Profile,
  work: WorkExperience[],
  education: Education[],
  jobDescription: string,
  targetRole?: string,
  targetCompany?: string,
): Promise<TailoredResume> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const profileContext = buildProfileContext(name, profile, work, education);

  const targetLine =
    targetRole || targetCompany
      ? `\nTARGET: ${[targetRole, targetCompany].filter(Boolean).join(" at ")}\n`
      : "";

  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert resume writer helping someone in a workforce re-entry program land a job. Create a tailored, ATS-friendly resume based ONLY on the candidate's real experience below. Do not invent employers, degrees, or accomplishments.

${profileContext}
${targetLine}
JOB DESCRIPTION:
${jobDescription}

Instructions:
1. Select and reword the most relevant accomplishments for this specific job.
2. Use strong action verbs and quantify outcomes wherever the source data supports it.
3. Prioritize recent and relevant experience; omit irrelevant roles if space is tight.
4. Keep the resume to one page worth of content (concise bullets).
5. Return ONLY valid JSON matching this schema (no markdown, no explanation):

${RESUME_JSON_SCHEMA}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No response from AI");
  }

  const raw = textBlock.text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse resume from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as TailoredResume;

  if (!parsed.headline || !parsed.summary || !Array.isArray(parsed.experience)) {
    throw new Error("AI returned an incomplete resume structure");
  }

  return parsed;
}
