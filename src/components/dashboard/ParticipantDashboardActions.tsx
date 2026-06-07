"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
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
        <Link href="/accountability#log-interview" className="sm:flex-1 sm:min-w-[140px]">
          <Button className="w-full">Log interview</Button>
        </Link>
        <Link href="/accountability#log-application" className="sm:flex-1 sm:min-w-[140px]">
          <Button variant="secondary" className="w-full">
            Log application
          </Button>
        </Link>
        <Link href="/profile?tab=resume" className="sm:flex-1 sm:min-w-[140px]">
          <Button variant="secondary" className="w-full">
            Build a resume
          </Button>
        </Link>
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
