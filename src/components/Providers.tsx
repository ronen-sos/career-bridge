"use client";

import { SessionProvider } from "next-auth/react";

import { ProgressBridgeProvider } from "@/components/goals/ProgressBridgeProvider";
import { UnreadRepliesProvider } from "@/lib/questions/unread-replies.client";

export function Providers({
  children,
  session,
  logBadgeCount = 0,
}: {
  children: React.ReactNode;
  session?: Parameters<typeof SessionProvider>[0]["session"];
  logBadgeCount?: number;
}) {
  let content = children;

  if (session?.user?.role === "PARTICIPANT") {
    content = (
      <UnreadRepliesProvider initialCount={logBadgeCount}>
        <ProgressBridgeProvider>{content}</ProgressBridgeProvider>
      </UnreadRepliesProvider>
    );
  }

  return <SessionProvider session={session}>{content}</SessionProvider>;
}
