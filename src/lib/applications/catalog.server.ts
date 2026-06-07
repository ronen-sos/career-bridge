import { db } from "@/lib/db";
import {
  normalizeCompanyName,
  normalizePositionTitle,
} from "@/lib/applications/normalize";
import {
  isSimilarCompanyName,
  rankSimilarCompanies,
  type SimilarCompanyMatch,
} from "@/lib/applications/similarity";

export async function searchCompanies(query: string, limit = 12) {
  const trimmed = query.trim();
  if (!trimmed) {
    return db.companyCatalog.findMany({
      orderBy: { name: "asc" },
      take: limit,
      select: { id: true, name: true },
    });
  }

  return db.companyCatalog.findMany({
    where: {
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { normalizedName: { contains: normalizeCompanyName(trimmed) } },
      ],
    },
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true },
  });
}

export async function findSimilarCompanies(
  name: string,
  excludeId?: string,
): Promise<SimilarCompanyMatch[]> {
  const trimmed = name.trim();
  if (!trimmed) return [];

  const candidates = await db.companyCatalog.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return rankSimilarCompanies(trimmed, candidates);
}

export async function resolveCompany(input: {
  companyId?: string;
  companyName?: string;
  allowSimilarOverride?: boolean;
}) {
  if (input.companyId) {
    const existing = await db.companyCatalog.findUnique({
      where: { id: input.companyId },
      select: { id: true, name: true },
    });
    if (!existing) {
      throw new Error("Company not found.");
    }
    return existing;
  }

  const name = input.companyName?.trim();
  if (!name) {
    throw new Error("Company name is required.");
  }

  const normalizedName = normalizeCompanyName(name);
  const exact = await db.companyCatalog.findUnique({
    where: { normalizedName },
    select: { id: true, name: true },
  });
  if (exact) return exact;

  const similar = await findSimilarCompanies(name);
  if (similar.length > 0 && !input.allowSimilarOverride) {
    const error = new Error("Similar company names found.");
    (error as Error & { similar: SimilarCompanyMatch[] }).similar = similar;
    throw error;
  }

  return db.companyCatalog.create({
    data: { name, normalizedName },
    select: { id: true, name: true },
  });
}

export async function searchPositions(companyId: string, query: string, limit = 12) {
  const trimmed = query.trim();
  const where = trimmed
    ? {
        companyId,
        OR: [
          { title: { contains: trimmed, mode: "insensitive" as const } },
          {
            normalizedTitle: {
              contains: normalizePositionTitle(trimmed),
            },
          },
        ],
      }
    : { companyId };

  return db.positionCatalog.findMany({
    where,
    orderBy: { title: "asc" },
    take: limit,
    select: { id: true, title: true, companyId: true },
  });
}

export async function resolvePosition(input: {
  companyId: string;
  positionId?: string;
  positionTitle?: string;
}) {
  if (input.positionId) {
    const existing = await db.positionCatalog.findFirst({
      where: { id: input.positionId, companyId: input.companyId },
      select: { id: true, title: true, companyId: true },
    });
    if (!existing) {
      throw new Error("Position not found for this company.");
    }
    return existing;
  }

  const title = input.positionTitle?.trim();
  if (!title) {
    throw new Error("Position title is required.");
  }

  const normalizedTitle = normalizePositionTitle(title);
  const existing = await db.positionCatalog.findUnique({
    where: {
      companyId_normalizedTitle: {
        companyId: input.companyId,
        normalizedTitle,
      },
    },
    select: { id: true, title: true, companyId: true },
  });
  if (existing) return existing;

  return db.positionCatalog.create({
    data: {
      companyId: input.companyId,
      title,
      normalizedTitle,
    },
    select: { id: true, title: true, companyId: true },
  });
}

export function companiesMatch(a: string, b: string): boolean {
  return isSimilarCompanyName(a, b);
}
