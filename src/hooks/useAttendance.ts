import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { AttendanceRow } from '@/types/database';
import {
  getAttendanceForDate,
  getWorkerAttendanceHistory,
  markAttendance,
  toDateString,
  AttendanceStatus,
} from '@/services/attendance';
import { dataSync } from '@/lib/dataSync';

export interface UseAttendanceResult {
  /** Map from worker_id to attendance row for the selected date */
  attendanceMap: Map<string, AttendanceRow>;
  loading: boolean;
  error: string | null;
  /** Mark or update attendance for a worker on the current date */
  mark: (workerId: string, siteId: string, status: AttendanceStatus) => Promise<void>;
  refetch: (isSilent?: boolean) => Promise<void>;
}

export function useAttendance(date: Date): UseAttendanceResult {
  const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceRow>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const dateStr = toDateString(date);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      const map = await getAttendanceForDate(date);
      if (isMountedRef.current) {
        setAttendanceMap(map);
        dataSync.markClean('attendance');
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Unable to load attendance.';
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  // Initial load — single authoritative fetch path
  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);


  // Live synchronization subscription
  useEffect(() => {
    const unsubscribe = dataSync.subscribe('attendance', (event) => {
      if (event.action === 'create' || event.action === 'update') {
        const row = event.payload;
        if (row.date === dateStr) {
          setAttendanceMap((prev) => {
            const next = new Map(prev);
            next.set(row.worker_id, row);
            return next;
          });
        }
      } else if (event.action === 'invalidate') {
        loadData(true);
      }
    });

    return unsubscribe;
  }, [dateStr, loadData]);

  // Intelligent navigation focus revalidation (only if marked stale)
  useFocusEffect(
    useCallback(() => {
      if (dataSync.isStale('attendance')) {
        loadData(true);
      }
    }, [loadData])
  );

  const mark = useCallback(
    async (workerId: string, siteId: string, status: AttendanceStatus) => {
      // Optimistic update
      const previousRow = attendanceMap.get(workerId);
      setAttendanceMap((prev) => {
        const next = new Map(prev);
        if (previousRow) {
          next.set(workerId, { ...previousRow, status });
        } else {
          next.set(workerId, {
            id: `temp-${workerId}`,
            worker_id: workerId,
            site_id: siteId,
            date: dateStr,
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            owner_id: '',
          });
        }
        return next;
      });

      try {
        const saved = await markAttendance(workerId, siteId, date, status);
        // Replace optimistic row with confirmed server row
        setAttendanceMap((prev) => {
          const next = new Map(prev);
          next.set(workerId, saved);
          return next;
        });
      } catch (err) {
        // Roll back optimistic update if mutation failed
        setAttendanceMap((prev) => {
          const next = new Map(prev);
          if (previousRow) {
            next.set(workerId, previousRow);
          } else {
            next.delete(workerId);
          }
          return next;
        });
        const message = err instanceof Error ? err.message : 'Failed to mark attendance.';
        setError(message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateStr, attendanceMap],
  );

  return { attendanceMap, loading, error, mark, refetch: loadData };
}

export interface UseWorkerAttendanceHistoryResult {
  history: AttendanceRow[];
  loading: boolean;
  error: string | null;
  refetch: (isSilent?: boolean) => Promise<void>;
}

export function useWorkerAttendanceHistory(
  workerId: string | undefined,
): UseWorkerAttendanceHistoryResult {
  const [history, setHistory] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(workerId));
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadHistory = useCallback(async (isSilent = false) => {
    if (!workerId || isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getWorkerAttendanceHistory(workerId);
      if (isMountedRef.current) {
        setHistory(data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message =
          err instanceof Error ? err.message : 'Unable to load attendance history.';
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [workerId]);

  // Initial load — single authoritative fetch path
  useEffect(() => {
    if (!workerId) return;
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    return () => {
      isMountedRef.current = false;
    };
  }, [workerId, loadHistory]);


  // Live synchronization for worker attendance history
  useEffect(() => {
    if (!workerId) return;

    const unsubscribe = dataSync.subscribe('attendance', (event) => {
      if (event.action === 'create' || event.action === 'update') {
        const row = event.payload;
        if (row.worker_id === workerId) {
          setHistory((prev) => {
            const exists = prev.some((h) => h.id === row.id || (h.worker_id === row.worker_id && h.date === row.date));
            if (exists) {
              return prev.map((h) => (h.id === row.id || (h.worker_id === row.worker_id && h.date === row.date) ? row : h));
            }
            return [row, ...prev];
          });
        }
      } else if (event.action === 'invalidate') {
        loadHistory(true);
      }
    });

    return unsubscribe;
  }, [workerId, loadHistory]);

  return { history, loading, error, refetch: loadHistory };
}

