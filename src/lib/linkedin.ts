const PROFILE_PATH = /^\/(in|pub)\/[^/?#]+\/?$/i;

function parseLinkedInUrl(value: string): URL | null {
  let url = value.trim();
  if (!url) return null;

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/\//, "")}`;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "linkedin.com") return null;
    if (!PROFILE_PATH.test(parsed.pathname)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isValidLinkedInUrl(value: string): boolean {
  return parseLinkedInUrl(value) !== null;
}

/** Stores as https://www.linkedin.com/in/username */
export function normalizeLinkedInUrl(
  value: string | null | undefined,
): string | undefined {
  const parsed = value ? parseLinkedInUrl(value) : null;
  if (!parsed) return undefined;

  const path = parsed.pathname.replace(/\/$/, "");
  return `https://www.linkedin.com${path.toLowerCase()}`;
}

/** Compact form for resume headers: linkedin.com/in/username */
export function displayLinkedInUrl(value: string | null | undefined): string {
  const normalized = normalizeLinkedInUrl(value);
  if (!normalized) return value?.trim() ?? "";
  return normalized.replace(/^https?:\/\/www\./i, "");
}
