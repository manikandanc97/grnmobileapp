import { useState, useEffect, useCallback } from 'react';
import { WorkerWithSite, getWorkers, getWorkerById } from '@/services/workers';

export interface UseWorkersResult {
  workers: WorkerWithSite[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useWorkers(siteId?: string): UseWorkersResult {
  const [workers, setWorkers] = useState<WorkerWithSite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);
      setError(null);

      try {
        const data = await getWorkers(siteId);
        setWorkers(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load workers.';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [siteId],
  );

  useEffect(() => {
    let isMounted = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const data = await getWorkers(siteId);
        if (isMounted) setWorkers(data);
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load workers.';
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [siteId]);

  const onRefresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await loadData(false);
  }, [loadData]);

  return { workers, loading, refreshing, error, refetch, onRefresh };
}

export interface UseWorkerDetailsResult {
  worker: WorkerWithSite | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWorkerDetails(id: string | undefined): UseWorkerDetailsResult {
  const [worker, setWorker] = useState<WorkerWithSite | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'Invalid worker ID.');

  const loadDetail = useCallback(async (targetId: string) => {
    setError(null);
    try {
      const data = await getWorkerById(targetId);
      if (!data) {
        setWorker(null);
        setError('Worker not found.');
      } else {
        setWorker(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load worker details.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const data = await getWorkerById(id);
        if (isMounted) {
          if (!data) {
            setWorker(null);
            setError('Worker not found.');
          } else {
            setWorker(data);
          }
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load worker details.';
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    await loadDetail(id);
  }, [id, loadDetail]);

  return { worker, loading, error, refetch };
}
