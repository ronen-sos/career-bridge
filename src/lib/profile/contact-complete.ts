import { isValidPhoneUS } from "@/lib/phone";

export type ContactProfile = {
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  summary?: string | null;
};

export function isContactComplete(profile: ContactProfile | null | undefined): boolean {
  if (!profile) return false;

  return (
    !!profile.phone?.trim() &&
    isValidPhoneUS(profile.phone) &&
    !!profile.location?.trim() &&
    !!profile.headline?.trim() &&
    !!profile.summary?.trim()
  );
}

export const CONTACT_REQUIRED_MESSAGE =
  "Complete your contact information (phone, location, headline, and summary) before continuing.";
