import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { WorkerWithSite, getWorkers, getWorkerById } from '@/services/workers';
import { dataSync } from '@/lib/dataSync';

export interface UseWorkersResult {
  workers: WorkerWithSite[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: (isSilent?: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useWorkers(siteId?: string): UseWorkersResult {
  const [workers, setWorkers] = useState<WorkerWithSite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadData = useCallback(
    async (isRefresh = false, isSilent = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isRefresh) {
        setRefreshing(true);
      } else if (!isSilent) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getWorkers(siteId);
        if (isMountedRef.current) {
          setWorkers(data);
          dataSync.markClean('workers');
        }
      } catch (err) {
        if (isMountedRef.current) {
          const message = err instanceof Error ? err.message : 'Unable to load workers.';
          setError(message);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
        isFetchingRef.current = false;
      }
    },
    [siteId],
  );

  // Initial load — single authoritative fetch path
  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);



  // Live data synchronization subscription
  useEffect(() => {
    const unsubscribe = dataSync.subscribe('workers', (event) => {
      if (event.action === 'create') {
        const newWorker = event.payload;
        if (!siteId || newWorker.site_id === siteId) {
          setWorkers((prev) => {
            const exists = prev.some((w) => w.id === newWorker.id);
            if (exists) {
              return prev.map((w) => (w.id === newWorker.id ? newWorker : w));
            }
            return [newWorker, ...prev];
          });
        }
      } else if (event.action === 'update') {
        const updated = event.payload;
        if (!siteId || updated.site_id === siteId) {
          setWorkers((prev) =>
            prev.map((w) => (w.id === updated.id ? updated : w))
          );
        } else {
          setWorkers((prev) => prev.filter((w) => w.id !== updated.id));
        }
      } else if (event.action === 'delete') {
        setWorkers((prev) => prev.filter((w) => w.id !== event.payload.id));
      } else if (event.action === 'invalidate') {
        loadData(false, true);
      }
    });

    return unsubscribe;
  }, [siteId, loadData]);

  // Intelligent navigation focus revalidation (only if marked stale)
  useFocusEffect(
    useCallback(() => {
      if (dataSync.isStale('workers')) {
        loadData(false, true);
      }
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    await loadData(true, false);
  }, [loadData]);

  const refetch = useCallback(
    async (isSilent?: boolean) => {
      const silent = isSilent ?? (workers.length > 0);
      await loadData(false, silent);
    },
    [loadData, workers.length],
  );

  return { workers, loading, refreshing, error, refetch, onRefresh };
}

export interface UseWorkerDetailsResult {
  worker: WorkerWithSite | null;
  loading: boolean;
  error: string | null;
  refetch: (isSilent?: boolean) => Promise<void>;
}

export function useWorkerDetails(id: string | undefined): UseWorkerDetailsResult {
  const [worker, setWorker] = useState<WorkerWithSite | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'Invalid worker ID.');

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadDetail = useCallback(
    async (targetId: string, isSilent = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (!isSilent) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getWorkerById(targetId);
        if (isMountedRef.current) {
          if (!data) {
            setWorker(null);
            setError('Worker not found.');
          } else {
            setWorker(data);
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          const message = err instanceof Error ? err.message : 'Unable to load worker details.';
          setError(message);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    },
    [],
  );

  // Initial load — single authoritative fetch path
  useEffect(() => {
    if (!id) return;
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail(id);
    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);



  // Live synchronization for detail view
  useEffect(() => {
    if (!id) return;

    const unsubscribe = dataSync.subscribe('workers', (event) => {
      if (event.action === 'update' && event.payload.id === id) {
        setWorker(event.payload);
      } else if (event.action === 'delete' && event.payload.id === id) {
        setWorker(null);
        setError('Worker has been deleted.');
      } else if (event.action === 'invalidate') {
        loadDetail(id, true);
      }
    });

    return unsubscribe;
  }, [id, loadDetail]);

  // Revalidate on focus if stale
  useFocusEffect(
    useCallback(() => {
      if (id && dataSync.isStale('workers')) {
        loadDetail(id, true);
      }
    }, [id, loadDetail])
  );

  const refetch = useCallback(
    async (isSilent?: boolean) => {
      if (!id) return;
      const silent = isSilent ?? (worker !== null);
      await loadDetail(id, silent);
    },
    [id, loadDetail, worker],
  );

  return { worker, loading, error, refetch };
}

