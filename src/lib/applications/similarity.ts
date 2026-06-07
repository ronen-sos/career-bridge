import { normalizeCompanyName } from "@/lib/applications/normalize";

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }

  return matrix[b.length]![a.length]!;
}

export function similarityScore(a: string, b: string): number {
  const left = normalizeCompanyName(a);
  const right = normalizeCompanyName(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const maxLen = Math.max(left.length, right.length);
  if (maxLen === 0) return 1;

  const distance = levenshtein(left, right);
  return 1 - distance / maxLen;
}

export const SIMILAR_COMPANY_THRESHOLD = 0.82;

export function isSimilarCompanyName(a: string, b: string): boolean {
  const left = normalizeCompanyName(a);
  const right = normalizeCompanyName(b);
  if (!left || !right) return false;
  if (left === right) return true;

  if (left.includes(right) || right.includes(left)) {
    const shorter = Math.min(left.length, right.length);
    const longer = Math.max(left.length, right.length);
    if (shorter / longer >= 0.6) return true;
  }

  return similarityScore(left, right) >= SIMILAR_COMPANY_THRESHOLD;
}

export type SimilarCompanyMatch = {
  id: string;
  name: string;
  score: number;
};

export function rankSimilarCompanies(
  input: string,
  companies: { id: string; name: string }[],
): SimilarCompanyMatch[] {
  const normalized = normalizeCompanyName(input);
  if (!normalized) return [];

  return companies
    .map((company) => ({
      id: company.id,
      name: company.name,
      score: similarityScore(normalized, company.name),
    }))
    .filter((match) => match.score >= SIMILAR_COMPANY_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}
