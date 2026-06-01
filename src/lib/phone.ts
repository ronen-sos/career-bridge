export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits;
}

/** Formats a US phone number as (XXX) XXX-XXXX while typing. */
export function formatPhoneUS(value: string): string {
  const digits = phoneDigits(value).slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isValidPhoneUS(value: string): boolean {
  return phoneDigits(value).length === 10;
}

/** Returns standardized (XXX) XXX-XXXX or undefined if empty. */
export function normalizePhoneUS(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (!isValidPhoneUS(trimmed)) return undefined;
  return formatPhoneUS(trimmed);
}

/** Format stored values for display (handles legacy unformatted numbers). */
export function displayPhoneUS(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const digits = phoneDigits(value);
  if (digits.length === 10) return formatPhoneUS(digits);
  return value;
}
