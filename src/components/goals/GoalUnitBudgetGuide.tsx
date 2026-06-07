import {
  formatCustomGoalsBudgetDetail,
  formatGoalPeriodBudgetBreakdown,
  formatGoalPeriodBudgetUnits,
  type CustomGoalBudgetItem,
} from "@/lib/goals/budget-guide";
import {
  EMPLOYMENT_HOUR_UNIT_WEIGHT,
  INTERVIEW_UNIT_WEIGHT,
} from "@/lib/goals/units";

type GoalUnitBudgetGuideProps = {
  targetApplications: number;
  targetInterviews: number;
  targetEmploymentHours: number;
  customGoals: CustomGoalBudgetItem[];
};

export function GoalUnitBudgetGuide({
  targetApplications,
  targetInterviews,
  targetEmploymentHours,
  customGoals,
}: GoalUnitBudgetGuideProps) {
  const targets = {
    targetApplications,
    targetInterviews,
    targetEmploymentHours,
  };
  const totalUnits = formatGoalPeriodBudgetUnits(targets, customGoals);
  const breakdown = formatGoalPeriodBudgetBreakdown(targets, customGoals);
  const customDetail = formatCustomGoalsBudgetDetail(customGoals);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-stone-800">
      <p className="font-medium text-emerald-950">Weekly time budget</p>
      <p className="mt-1.5 text-stone-700">
        Use this budget to plan anticipated effort in <strong>units</strong> (1
        unit ≈ 1 hour). Weekly progress is tracked separately for each goal
        type—extra interviews or applications do not count toward other targets:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
        <li>Each application = ½ unit</li>
        <li>Each interview = {INTERVIEW_UNIT_WEIGHT} unit</li>
        <li>
          Each paid employment hour = {EMPLOYMENT_HOUR_UNIT_WEIGHT} unit
        </li>
        <li>Each custom goal = its expected hours in units when completed</li>
      </ul>
      <p className="mt-2 text-stone-700">
        Example: 10 applications, 5 interviews, 5 employment hours, and an
        8-hour workshop = 5 + 5 + 5 + 8 = <strong>23 units</strong>.
      </p>
      <p className="mt-3 border-t border-emerald-200/80 pt-3 text-stone-800">
        <span className="font-medium text-emerald-950">
          Anticipated effort this period:{" "}
        </span>
        {totalUnits > 0 ? (
          <>
            <strong>{totalUnits}</strong> unit{totalUnits === 1 ? "" : "s"} (
            {breakdown})
          </>
        ) : (
          "Set targets above to calculate the weekly budget."
        )}
      </p>
      {customDetail && (
        <p className="mt-2 text-xs text-stone-600">
          Custom goals: {customDetail}
        </p>
      )}
    </div>
  );
}
