"use client";

import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import {
  AskManagerDialog,
  type AskManagerConfig,
} from "@/components/dashboard/AskManagerDialog";
import {
  CustomGoalsLogDialog,
  type CustomGoalsLogConfig,
} from "@/components/dashboard/CustomGoalsLogDialog";
import {
  EmploymentHoursLogDialog,
  type EmploymentHoursLogConfig,
} from "@/components/dashboard/EmploymentHoursLogDialog";

export function ParticipantDashboardActions({
  hoursLog,
  customGoalsLog,
  askManager,
}: {
  hoursLog?: EmploymentHoursLogConfig | null;
  customGoalsLog?: CustomGoalsLogConfig | null;
  askManager?: AskManagerConfig | null;
}) {
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [customGoalsDialogOpen, setCustomGoalsDialogOpen] = useState(false);
  const [askManagerDialogOpen, setAskManagerDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <ButtonLink
          href="/accountability#log-interview"
          className="w-full sm:flex-1 sm:min-w-[140px]"
        >
          Log interview
        </ButtonLink>
        <ButtonLink
          href="/accountability#log-application"
          variant="secondary"
          className="w-full sm:flex-1 sm:min-w-[140px]"
        >
          Log application
        </ButtonLink>
        <ButtonLink
          href="/profile?tab=resume"
          variant="secondary"
          className="w-full sm:flex-1 sm:min-w-[140px]"
        >
          Build a resume
        </ButtonLink>
        {customGoalsLog && (
          <div className="sm:flex-1 sm:min-w-[140px]">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setCustomGoalsDialogOpen(true)}
            >
              Custom goals
            </Button>
          </div>
        )}
        {hoursLog && (
          <div className="sm:flex-1 sm:min-w-[140px]">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setHoursDialogOpen(true)}
            >
              Log hours worked
            </Button>
          </div>
        )}
        {askManager && (
          <div className="sm:flex-1 sm:min-w-[140px]">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setAskManagerDialogOpen(true)}
            >
              Ask manager
            </Button>
          </div>
        )}
      </div>

      {customGoalsLog && (
        <CustomGoalsLogDialog
          open={customGoalsDialogOpen}
          onOpenChange={setCustomGoalsDialogOpen}
          config={customGoalsLog}
        />
      )}

      {hoursLog && (
        <EmploymentHoursLogDialog
          open={hoursDialogOpen}
          onOpenChange={setHoursDialogOpen}
          config={hoursLog}
        />
      )}

      {askManager && (
        <AskManagerDialog
          open={askManagerDialogOpen}
          onOpenChange={setAskManagerDialogOpen}
          config={askManager}
        />
      )}
    </>
  );
}
