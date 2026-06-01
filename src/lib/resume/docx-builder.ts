import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

import type { TailoredResume } from "@/lib/resume/anthropic";
import { displayPhoneUS } from "@/lib/phone";
import { displayLinkedInUrl } from "@/lib/linkedin";

export async function buildResumeDocx(
  candidateName: string,
  resume: TailoredResume,
  contact?: {
    phone?: string | null;
    email?: string;
    location?: string | null;
    linkedInUrl?: string | null;
  },
): Promise<Buffer> {
  const contactParts = [
    contact?.phone ? displayPhoneUS(contact.phone) : null,
    contact?.email,
    contact?.location,
    contact?.linkedInUrl ? displayLinkedInUrl(contact.linkedInUrl) : null,
  ].filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: candidateName,
          bold: true,
          size: 32,
          font: "Calibri",
        }),
      ],
    }),
  ];

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: contactParts.join("  •  "),
            size: 20,
            font: "Calibri",
            color: "444444",
          }),
        ],
      }),
    );
  }

  if (resume.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: resume.headline,
            size: 22,
            font: "Calibri",
            italics: true,
          }),
        ],
      }),
    );
  }

  children.push(sectionHeading("Professional Summary"));
  children.push(bodyParagraph(resume.summary));

  if (resume.skills?.length) {
    children.push(sectionHeading("Skills"));
    children.push(bodyParagraph(resume.skills.join("  •  ")));
  }

  if (resume.experience?.length) {
    children.push(sectionHeading("Experience"));
    for (const exp of resume.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [
            new TextRun({ text: exp.title, bold: true, size: 22, font: "Calibri" }),
            new TextRun({ text: `  |  ${exp.company}`, size: 22, font: "Calibri" }),
          ],
        }),
      );
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: exp.dates,
              size: 20,
              font: "Calibri",
              italics: true,
              color: "555555",
            }),
          ],
        }),
      );
      for (const bullet of exp.bullets) {
        children.push(bulletParagraph(bullet));
      }
    }
  }

  if (resume.education?.length) {
    children.push(sectionHeading("Education"));
    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 22, font: "Calibri" }),
            new TextRun({ text: `  |  ${edu.institution}`, size: 22, font: "Calibri" }),
          ],
        }),
      );
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: edu.dates,
              size: 20,
              font: "Calibri",
              italics: true,
              color: "555555",
            }),
          ],
        }),
      );
      if (edu.details) {
        children.push(bodyParagraph(edu.details));
      }
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "047857" },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
        font: "Calibri",
        color: "047857",
      }),
    ],
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Calibri" })],
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: "•  ", size: 22, font: "Calibri" }),
      new TextRun({ text, size: 22, font: "Calibri" }),
    ],
  });
}
