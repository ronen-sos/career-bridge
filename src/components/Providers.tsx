"use client";

import { SessionProvider } from "next-auth/react";

import { ProgressBridgeProvider } from "@/components/goals/ProgressBridgeProvider";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Parameters<typeof SessionProvider>[0]["session"];
}) {
  const content =
    session?.user?.role === "PARTICIPANT" ? (
      <ProgressBridgeProvider>{children}</ProgressBridgeProvider>
    ) : (
      children
    );

  return <SessionProvider session={session}>{content}</SessionProvider>;
}
