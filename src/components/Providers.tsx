"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

import { ProgressBridgeProvider } from "@/components/goals/ProgressBridgeProvider";
import { UnreadRepliesProvider } from "@/lib/questions/unread-replies.client";

function CloseOrphanedDialogs() {
  useEffect(() => {
    document.querySelectorAll("dialog[open]").forEach((node) => {
      if (node instanceof HTMLDialogElement) node.close();
    });
  }, []);
  return null;
}

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

  return <SessionProvider session={session}><CloseOrphanedDialogs />{content}</SessionProvider>;
}
