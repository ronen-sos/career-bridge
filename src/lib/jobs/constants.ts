export const JOB_SEARCH_ZIP = "55107";
/** West Side St. Paul — center point for distance calculations. */
export const JOB_ORIGIN_LAT = 44.9275;
export const JOB_ORIGIN_LNG = -93.0718;
/** Default radius shown on the jobs page slider. */
export const JOB_DEFAULT_RADIUS_MILES = 15;
/** Wider radius used when syncing listings from Adzuna (users filter down). */
export const JOB_SYNC_RADIUS_MILES = 30;
export const JOB_MIN_RADIUS_MILES = 1;
export const JOB_MAX_RADIUS_MILES = 30;
export const JOB_MAX_DAYS_OLD = 14;
export const JOB_SYNC_STALE_HOURS = 24;
export const JOB_RADIUS_STORAGE_KEY = "career-bridge-job-radius";

/** Entry-level searches near West Side St. Paul (55107). */
export const JOB_SEARCH_QUERIES = [
  "warehouse entry level",
  "production assembler",
  "janitorial custodian",
  "food service dishwasher",
  "delivery driver",
  "general labor",
  "manufacturing operator",
  "retail stocker",
  "packaging material handler",
  "housekeeping cleaner",
] as const;

export const RECOVERY_POSITIVE_KEYWORDS = [
  "entry level",
  "entry-level",
  "no experience",
  "no prior experience",
  "will train",
  "willing to train",
  "training provided",
  "second chance",
  "fair chance",
  "background friendly",
  "re-entry",
  "reentry",
  "recovery friendly",
  "warehouse",
  "production",
  "assembler",
  "assembly",
  "packaging",
  "janitor",
  "janitorial",
  "custodial",
  "cleaning",
  "sanitation",
  "dishwasher",
  "cook",
  "kitchen",
  "hospitality",
  "housekeeping",
  "driver",
  "delivery",
  "laborer",
  "general labor",
  "material handler",
  "forklift",
  "maintenance",
  "landscaping",
  "retail",
  "stocker",
  "stocking",
  "cashier",
  "manufacturing",
  "picker",
  "packer",
  "production worker",
  "machine operator",
  "hotel",
  "groundskeeper",
] as const;

export const RECOVERY_NEGATIVE_KEYWORDS = [
  "security clearance",
  "top secret",
  "ts/sci",
  "active clearance",
  "secret clearance",
  "10+ years",
  "10 years of experience",
  "8 years experience",
  "minimum 7 years",
  "minimum 5 years",
  "phd required",
  "doctorate",
  "bar admission",
  "cpa required",
  "must be licensed attorney",
  "board certified",
] as const;

export const RECOVERY_FRIENDLY_MIN_SCORE = 2;
