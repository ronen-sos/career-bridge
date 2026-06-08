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
