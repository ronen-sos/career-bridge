import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addCalendarDays,
  countCalendarDaysInclusive,
  countDaysElapsedInPeriod,
  isDateInPeriod,
  parseCalendarDate,
  toDateInputValue,
} from "@/lib/goals/dates";
import {
  defaultWeekEnd,
  isDateInWeek,
  nextGoalPeriodEnd,
  nextGoalPeriodStart,
} from "@/lib/goals/progress";

describe("calendar goal periods", () => {
  const weekStart = "2025-06-07"; // Sunday
  const weekEnd = "2025-06-13"; // Saturday

  it("counts seven inclusive days from Jun 7 through Jun 13", () => {
    assert.equal(countCalendarDaysInclusive(weekStart, weekEnd), 7);
    assert.equal(
      toDateInputValue(defaultWeekEnd(weekStart)),
      weekEnd,
    );
  });

  it("includes activity on the end date through end of that day", () => {
    assert.equal(isDateInPeriod("2025-06-13", weekStart, weekEnd), true);
    assert.equal(isDateInWeek("2025-06-13", weekStart, weekEnd), true);
    assert.equal(isDateInPeriod("2025-06-14", weekStart, weekEnd), false);
  });

  it("does not overlap the next period on the day after end", () => {
    const nextStart = toDateInputValue(nextGoalPeriodStart(weekEnd));
    assert.equal(nextStart, "2025-06-14");
    assert.equal(
      toDateInputValue(nextGoalPeriodEnd(weekEnd)),
      "2025-06-20",
    );
    assert.equal(isDateInPeriod("2025-06-13", nextStart, "2025-06-20"), false);
  });

  it("reads Postgres @db.Date values without shifting the calendar day", () => {
    const prismaDate = new Date("2025-06-08T00:00:00.000Z");
    assert.equal(toDateInputValue(prismaDate), "2025-06-08");
    assert.equal(
      countCalendarDaysInclusive(prismaDate, "2025-06-13"),
      6,
    );
  });

  it("uses local calendar parts for non-midnight instants", () => {
    const localNoon = new Date(2025, 5, 9, 12, 0, 0, 0);
    assert.equal(toDateInputValue(localNoon), "2025-06-09");
  });

  it("counts elapsed days for Jun 8–13 on Jun 9 as day 2 of 6", () => {
    const periodStart = "2025-06-08";
    const periodEnd = "2025-06-13";
    assert.equal(countCalendarDaysInclusive(periodStart, periodEnd), 6);
    assert.equal(
      countDaysElapsedInPeriod(
        periodStart,
        periodEnd,
        parseCalendarDate("2025-06-09"),
      ),
      2,
    );
  });

  it("parses YYYY-MM-DD without UTC day shift", () => {
    assert.equal(toDateInputValue(parseCalendarDate("2025-06-13")), "2025-06-13");
    assert.equal(
      toDateInputValue(new Date(2025, 5, 13)),
      "2025-06-13",
    );
  });

  it("counts elapsed days with the start day as day 1", () => {
    assert.equal(
      countDaysElapsedInPeriod(weekStart, weekEnd, parseCalendarDate("2025-06-07")),
      1,
    );
    assert.equal(
      countDaysElapsedInPeriod(weekStart, weekEnd, parseCalendarDate("2025-06-13")),
      7,
    );
    assert.equal(
      countDaysElapsedInPeriod(weekStart, weekEnd, addCalendarDays(weekEnd, 1)),
      7,
    );
  });
});
