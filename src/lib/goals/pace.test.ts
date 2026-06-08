import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCalendarDate } from "@/lib/goals/dates";
import type { GoalProgress } from "@/lib/goals/progress";
import { computeGoalPace } from "@/lib/goals/pace";

const emptyStats: GoalProgress = {
  applications: 0,
  interviews: 0,
  employmentHours: 0,
  targetApplications: 75,
  targetInterviews: 5,
  targetEmploymentHours: 0,
  totalHours: 0,
  targetTotalHours: 0,
};

describe("computeGoalPace", () => {
  it("expects one-seventh progress on the first day of a seven-day period", () => {
    const pace = computeGoalPace(
      { weekStart: "2025-06-07", weekEnd: "2025-06-13" },
      emptyStats,
      { today: parseCalendarDate("2025-06-07") },
    );

    assert.equal(pace.daysTotal, 7);
    assert.equal(pace.daysElapsed, 1);
    assert.ok(Math.abs(pace.expectedFraction - 1 / 7) < 0.001);
  });

  it("expects full period elapsed on the end date", () => {
    const pace = computeGoalPace(
      { weekStart: "2025-06-07", weekEnd: "2025-06-13" },
      emptyStats,
      { today: parseCalendarDate("2025-06-13") },
    );

    assert.equal(pace.daysElapsed, 7);
    assert.equal(pace.expectedFraction, 1);
  });
});
