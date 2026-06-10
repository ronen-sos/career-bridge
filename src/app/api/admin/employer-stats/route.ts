import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getEmployerInterviewStats } from "@/lib/interviews/record.server";
import { isAdminRole, isSuperAdmin } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSuperAdmin(session.user.role) && !session.user.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employers = await getEmployerInterviewStats(
    isSuperAdmin(session.user.role)
      ? undefined
      : { organizationId: session.user.organizationId! },
  );

  const totals = employers.reduce(
    (acc, row) => ({
      applications: acc.applications + row.applications,
      interviews: acc.interviews + row.interviews,
      linkedInterviews: acc.linkedInterviews + row.linkedInterviews,
      noApplicationInterviews:
        acc.noApplicationInterviews + row.noApplicationInterviews,
    }),
    {
      applications: 0,
      interviews: 0,
      linkedInterviews: 0,
      noApplicationInterviews: 0,
    },
  );

  return NextResponse.json({
    employers,
    totals: {
      ...totals,
      followThroughRate:
        totals.applications > 0
          ? Math.round((totals.linkedInterviews / totals.applications) * 100)
          : null,
    },
  });
}
