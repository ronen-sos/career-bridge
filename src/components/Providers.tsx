"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Parameters<typeof SessionProvider>[0]["session"];
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
