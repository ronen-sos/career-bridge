const DATE_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a calendar date (YYYY-MM-DD or Date) to local midnight. */
export function parseCalendarDate(input: Date | string): Date {
  if (typeof input === "string") {
    const match = DATE_INPUT_RE.exec(input.trim());
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
  }

  const parsed = new Date(input);
  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    0,
    0,
    0,
    0,
  );
}

/** Format a date as YYYY-MM-DD in the local timezone. */
export function toDateInputValue(date: Date | string): string {
  const d = parseCalendarDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
