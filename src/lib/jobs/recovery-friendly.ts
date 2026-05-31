import {
  RECOVERY_FRIENDLY_MIN_SCORE,
  RECOVERY_NEGATIVE_KEYWORDS,
  RECOVERY_POSITIVE_KEYWORDS,
} from "@/lib/jobs/constants";

export type RecoveryScore = {
  score: number;
  isRecoveryFriendly: boolean;
  matchedPositive: string[];
  matchedNegative: string[];
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function scoreRecoveryFriendliness(
  title: string,
  description: string,
): RecoveryScore {
  const text = normalize(`${title} ${description}`);
  const matchedPositive = RECOVERY_POSITIVE_KEYWORDS.filter((keyword) =>
    text.includes(keyword),
  );
  const matchedNegative = RECOVERY_NEGATIVE_KEYWORDS.filter((keyword) =>
    text.includes(keyword),
  );

  let score = matchedPositive.length * 2;
  if (matchedPositive.some((keyword) => normalize(title).includes(keyword))) {
    score += 3;
  }
  score -= matchedNegative.length * 5;

  return {
    score,
    isRecoveryFriendly:
      matchedNegative.length === 0 && score >= RECOVERY_FRIENDLY_MIN_SCORE,
    matchedPositive,
    matchedNegative,
  };
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export function formatPayRange(
  salaryMin?: number,
  salaryMax?: number,
): string | null {
  if (!salaryMin && !salaryMax) return null;

  const format = (value: number) =>
    value >= 1000 ? `$${Math.round(value / 1000)}k/yr` : `$${value}/yr`;

  if (salaryMin && salaryMax) {
    return `${format(salaryMin)}–${format(salaryMax)}`;
  }
  if (salaryMin) return `From ${format(salaryMin)}`;
  return `Up to ${format(salaryMax!)}`;
}

export function inferRequirements(description: string): string | null {
  const lines = description
    .split(/[\n.]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const requirementLine = lines.find((line) =>
    /requirement|qualification|must have|license|certification|background check/i.test(
      line,
    ),
  );

  return requirementLine ? truncate(requirementLine, 180) : null;
}

export function extractSourceFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const source = hostname.split(".")[0];
    return source.charAt(0).toUpperCase() + source.slice(1);
  } catch {
    return "Employer site";
  }
}
