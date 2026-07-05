import { useCallback, useEffect, useState } from "react";
import { getAllSessions } from "../lib/storage";
import type { SessionRecord } from "../types";

export function useSessions() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await getAllSessions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { sessions, loading, refresh };
}
