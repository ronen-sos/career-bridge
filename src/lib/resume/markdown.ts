import type { TailoredResume } from "@/lib/resume/anthropic";
import { displayPhoneUS } from "@/lib/phone";
import { displayLinkedInUrl } from "@/lib/linkedin";

type ContactInfo = {
  phone?: string | null;
  email?: string;
  location?: string | null;
  linkedInUrl?: string | null;
};

export function resumeToMarkdown(
  candidateName: string,
  resume: TailoredResume,
  contact?: ContactInfo,
): string {
  const lines: string[] = [`# ${candidateName}`, ""];

  const contactParts = [
    contact?.phone ? displayPhoneUS(contact.phone) : null,
    contact?.email,
    contact?.location,
    contact?.linkedInUrl ? displayLinkedInUrl(contact.linkedInUrl) : null,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    lines.push(contactParts.join("  •  "), "");
  }

  if (resume.headline) {
    lines.push(`*${resume.headline}*`, "");
  }

  lines.push("## Professional Summary", "", resume.summary, "");

  if (resume.skills?.length) {
    lines.push("## Skills", "", resume.skills.join("  •  "), "");
  }

  if (resume.experience?.length) {
    lines.push("## Experience", "");
    for (const exp of resume.experience) {
      lines.push(`### ${exp.title} | ${exp.company}`);
      lines.push(`*${exp.dates}*`, "");
      for (const bullet of exp.bullets) {
        lines.push(`- ${bullet}`);
      }
      lines.push("");
    }
  }

  if (resume.education?.length) {
    lines.push("## Education", "");
    for (const edu of resume.education) {
      lines.push(`### ${edu.degree} | ${edu.institution}`);
      lines.push(`*${edu.dates}*`, "");
      if (edu.details) {
        lines.push(edu.details, "");
      }
    }
  }

  return lines.join("\n").trimEnd();
}

export function resumeMarkdownFilename(
  targetCompany?: string | null,
  createdAt?: Date,
): string {
  const date = createdAt ?? new Date();
  const stamp = date.toISOString().split("T")[0];
  if (targetCompany) {
    const slug = targetCompany.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return `resume-${slug}-${stamp}.docx`;
  }
  return `resume-${stamp}.docx`;
}
