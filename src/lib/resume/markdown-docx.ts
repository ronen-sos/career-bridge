import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

/**
 * Converts stored resume markdown (app format from resumeToMarkdown) to .docx.
 */
export async function buildDocxFromMarkdown(markdown: string): Promise<Buffer> {
  const lines = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd());

  const children: Paragraph[] = [];
  let i = 0;
  let seenName = false;
  let seenContact = false;
  let currentSection = "";

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.startsWith("# ")) {
      children.push(nameParagraph(line.slice(2).trim()));
      seenName = true;
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      currentSection = line.slice(3).trim();
      children.push(sectionHeading(currentSection));
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      const [title, org] = line
        .slice(4)
        .split("|")
        .map((s) => s.trim());
      children.push(titleOrgParagraph(title ?? "", org));
      i++;
      if (i < lines.length && lines[i]?.startsWith("*") && lines[i]?.endsWith("*")) {
        children.push(datesParagraph(lines[i]!.slice(1, -1)));
        i++;
      }
      continue;
    }

    if (line.startsWith("- ")) {
      children.push(bulletParagraph(line.slice(2)));
      i++;
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (
      seenName &&
      !seenContact &&
      !line.startsWith("#") &&
      line.includes("•")
    ) {
      children.push(contactParagraph(line));
      seenContact = true;
      i++;
      continue;
    }

    if (
      seenName &&
      line.startsWith("*") &&
      line.endsWith("*") &&
      currentSection === ""
    ) {
      children.push(headlineParagraph(line.slice(1, -1)));
      i++;
      continue;
    }

    if (line.startsWith("*") && line.endsWith("*")) {
      children.push(datesParagraph(line.slice(1, -1)));
      i++;
      continue;
    }

    children.push(bodyParagraph(line));
    i++;
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}

function nameParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({ text, bold: true, size: 32, font: "Calibri" }),
    ],
  });
}

function contactParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({ text, size: 20, font: "Calibri", color: "444444" }),
    ],
  });
}

function headlineParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({ text, size: 22, font: "Calibri", italics: true }),
    ],
  });
}

function titleOrgParagraph(title: string, org?: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 40 },
    children: [
      new TextRun({ text: title, bold: true, size: 22, font: "Calibri" }),
      ...(org
        ? [new TextRun({ text: `  |  ${org}`, size: 22, font: "Calibri" })]
        : []),
    ],
  });
}

function datesParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        size: 20,
        font: "Calibri",
        italics: true,
        color: "555555",
      }),
    ],
  });
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
