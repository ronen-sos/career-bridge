export function normalizeCatalogName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

export function normalizeCompanyName(value: string): string {
  return normalizeCatalogName(value);
}

export function normalizePositionTitle(value: string): string {
  return normalizeCatalogName(value);
}
