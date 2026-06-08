import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GoalProgress } from "@/lib/goals/progress";
import { computeCompositeProgressFraction } from "@/lib/goals/units";

function stats(
  overrides: Partial<GoalProgress> & Pick<GoalProgress, "targetApplications" | "targetInterviews">,
): GoalProgress {
  return {
    applications: 0,
    interviews: 0,
    employmentHours: 0,
    targetEmploymentHours: 0,
    totalHours: 0,
    targetTotalHours: 0,
    ...overrides,
  };
}

describe("computeCompositeProgressFraction", () => {
  it("weights interviews by unit share, not equal category share", () => {
    const progress = computeCompositeProgressFraction(
      stats({
        targetApplications: 75,
        targetInterviews: 5,
        interviews: 1,
      }),
    );

    // 75 apps * 0.5 + 5 interviews * 1 = 42.5 target units; 1 interview = 1 unit
    assert.ok(
      progress > 0.02 && progress < 0.03,
      `expected ~2.4%, got ${(progress * 100).toFixed(1)}%`,
    );
  });

  it("does not let one interview count like half the week when interview target is 1", () => {
    const progress = computeCompositeProgressFraction(
      stats({
        targetApplications: 75,
        targetInterviews: 1,
        interviews: 1,
      }),
    );

    // 37.5 + 1 = 38.5 target units
    assert.ok(
      progress < 0.05,
      `one interview with 75-app target should be under 5%, got ${(progress * 100).toFixed(1)}%`,
    );
  });

  it("caps each category at its target", () => {
    const progress = computeCompositeProgressFraction(
      stats({
        targetApplications: 5,
        targetInterviews: 1,
        applications: 100,
        interviews: 10,
      }),
    );

    assert.equal(progress, 1);
  });

  it("includes employment hours and custom goals in the unit total", () => {
    const progress = computeCompositeProgressFraction(
      stats({
        targetApplications: 10,
        targetInterviews: 0,
        targetEmploymentHours: 10,
        employmentHours: 5,
      }),
      [{ expectedHours: 4, completed: true }],
    );

    // 5 employment hrs + 4 custom = 9 of 5 + 10 + 4 = 19
    assert.ok(Math.abs(progress - 9 / 19) < 0.001);
  });
});
