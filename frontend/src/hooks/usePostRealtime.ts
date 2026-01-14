import { useEffect, useMemo, useRef } from 'react';
import { PostRealtimeClient, type RealtimePostStats } from '@/lib/postRealtime';

/**
 * Shared singleton client per page session.
 * Reconnects automatically.
 */
let singleton: PostRealtimeClient | null = null;

function getClient(): PostRealtimeClient {
  if (!singleton) singleton = new PostRealtimeClient('/ws/posts');
  return singleton;
}

export function usePostRealtime(postIds: number[], onStats: (stats: RealtimePostStats) => void) {
  const idsKey = useMemo(() => {
    const uniq = Array.from(new Set(postIds.filter((n) => Number.isFinite(n))));
    uniq.sort((a, b) => a - b);
    return uniq.join(',');
  }, [postIds]);

  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',').map((s) => Number(s)).filter((n) => Number.isFinite(n)) : [];
    if (ids.length === 0) return;

    const client = getClient();
    let cancelled = false;
    let subs: { unsubscribe: () => void }[] = [];

    (async () => {
      try {
        await client.connect();
        if (cancelled) return;

        subs = ids.map((id) => client.subscribe(id, (stats: RealtimePostStats) => onStatsRef.current(stats)));
      } catch {
        // If WS fails, silently ignore (polling could be added as fallback).
      }
    })();

    return () => {
      cancelled = true;
      subs.forEach((s) => s.unsubscribe());
    };
  }, [idsKey]);
}
