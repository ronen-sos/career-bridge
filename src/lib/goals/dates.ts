const DATE_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function calendarDateFromParts(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/** Postgres @db.Date values arrive as UTC midnight — read the UTC calendar day. */
function isUtcDateOnlyInstant(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

function calendarPartsFromDate(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  if (isUtcDateOnlyInstant(date)) {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/** Parse a calendar date (YYYY-MM-DD or Date) to local midnight. */
export function parseCalendarDate(input: Date | string): Date {
  if (typeof input === "string") {
    const match = DATE_INPUT_RE.exec(input.trim());
    if (match) {
      return calendarDateFromParts(
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
      );
    }
  }

  const parsed = typeof input === "string" ? new Date(input) : input;
  const { year, month, day } = calendarPartsFromDate(parsed);
  return calendarDateFromParts(year, month, day);
}

/** Format a date as YYYY-MM-DD. */
export function toDateInputValue(date: Date | string): string {
  if (typeof date === "string") {
    const match = DATE_INPUT_RE.exec(date.trim());
    if (match) return date.trim();
  }

  const parsed = typeof date === "string" ? new Date(date) : date;
  const { year, month, day } = calendarPartsFromDate(parsed);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Today's calendar date at local midnight (browser or Node local TZ). */
export function todayInLocalCalendar(): Date {
  const now = new Date();
  return calendarDateFromParts(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
}

export function endOfCalendarDay(date: Date | string): Date {
  const d = parseCalendarDate(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addCalendarDays(date: Date | string, days: number): Date {
  const d = parseCalendarDate(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Inclusive count of calendar days from start through end. */
export function countCalendarDaysInclusive(
  startInput: Date | string,
  endInput: Date | string,
): number {
  const start = parseCalendarDate(startInput);
  const end = parseCalendarDate(endInput);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / 86_400_000) + 1;
}

export function periodBounds(
  startInput: Date | string,
  endInput: Date | string,
): { start: Date; end: Date } {
  return {
    start: parseCalendarDate(startInput),
    end: endOfCalendarDay(endInput),
  };
}

/** True when `date` falls on an inclusive calendar-day range [start, end]. */
export function isDateInPeriod(
  date: Date | string,
  startInput: Date | string,
  endInput: Date | string,
): boolean {
  const { start, end } = periodBounds(startInput, endInput);
  const d = parseCalendarDate(date);
  d.setHours(12, 0, 0, 0);
  return d >= start && d <= end;
}

/** Days elapsed in the period through `today`, counting the start day as day 1. */
export function countDaysElapsedInPeriod(
  startInput: Date | string,
  endInput: Date | string,
  today: Date = new Date(),
): number {
  const start = parseCalendarDate(startInput);
  const end = endOfCalendarDay(endInput);
  const total = countCalendarDaysInclusive(start, end);
  const t = parseCalendarDate(today);
  t.setHours(12, 0, 0, 0);

  if (t < start) return 0;
  if (t > end) return total;

  return countCalendarDaysInclusive(start, t);
}
