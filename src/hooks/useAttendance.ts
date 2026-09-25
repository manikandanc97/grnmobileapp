import { useState, useEffect, useCallback } from 'react';
import { AttendanceRow } from '@/types/database';
import {
  getAttendanceForDate,
  getWorkerAttendanceHistory,
  markAttendance,
  toDateString,
  AttendanceStatus,
} from '@/services/attendance';

export interface UseAttendanceResult {
  /** Map from worker_id to attendance row for the selected date */
  attendanceMap: Map<string, AttendanceRow>;
  loading: boolean;
  error: string | null;
  /** Mark or update attendance for a worker on the current date */
  mark: (workerId: string, siteId: string, status: AttendanceStatus) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAttendance(date: Date): UseAttendanceResult {
  const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceRow>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const dateStr = toDateString(date);

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const map = await getAttendanceForDate(date);
      setAttendanceMap(map);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load attendance.';
      setError(message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  useEffect(() => {
    let isMounted = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const map = await getAttendanceForDate(date);
        if (isMounted) setAttendanceMap(map);
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load attendance.';
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  const mark = useCallback(
    async (workerId: string, siteId: string, status: AttendanceStatus) => {
      // Optimistic update
      setAttendanceMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(workerId);
        if (existing) {
          next.set(workerId, { ...existing, status });
        } else {
          // Temporary optimistic row (no real id yet)
          next.set(workerId, {
            id: `temp-${workerId}`,
            worker_id: workerId,
            site_id: siteId,
            date: dateStr,
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        return next;
      });

      try {
        const saved = await markAttendance(workerId, siteId, date, status);
        // Replace optimistic row with real row
        setAttendanceMap((prev) => {
          const next = new Map(prev);
          next.set(workerId, saved);
          return next;
        });
      } catch (err) {
        // Roll back optimistic update by re-fetching
        const message = err instanceof Error ? err.message : 'Failed to mark attendance.';
        setError(message);
        await loadData();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateStr, loadData],
  );

  return { attendanceMap, loading, error, mark, refetch: loadData };
}

export interface UseWorkerAttendanceHistoryResult {
  history: AttendanceRow[];
  loading: boolean;
  error: string | null;
}

export function useWorkerAttendanceHistory(
  workerId: string | undefined,
): UseWorkerAttendanceHistoryResult {
  const [history, setHistory] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(workerId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workerId) return;
    let isMounted = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const data = await getWorkerAttendanceHistory(workerId);
        if (isMounted) setHistory(data);
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : 'Unable to load attendance history.';
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [workerId]);

  return { history, loading, error };
}
