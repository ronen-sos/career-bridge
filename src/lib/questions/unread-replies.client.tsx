"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type UnreadRepliesContextValue = {
  logBadgeCount: number;
  markRepliesRead: (count?: number) => void;
};

const UnreadRepliesContext = createContext<UnreadRepliesContextValue | null>(
  null,
);

export function UnreadRepliesProvider({
  initialCount,
  children,
}: {
  initialCount: number;
  children: React.ReactNode;
}) {
  const [clearedCount, setClearedCount] = useState(0);

  useEffect(() => {
    setClearedCount(0);
  }, [initialCount]);

  const markRepliesRead = useCallback((count = 1) => {
    setClearedCount((current) => current + count);
  }, []);

  const logBadgeCount = Math.max(0, initialCount - clearedCount);

  const value = useMemo(
    () => ({ logBadgeCount, markRepliesRead }),
    [logBadgeCount, markRepliesRead],
  );

  return (
    <UnreadRepliesContext.Provider value={value}>
      {children}
    </UnreadRepliesContext.Provider>
  );
}

export function useUnreadReplies() {
  return useContext(UnreadRepliesContext);
}
