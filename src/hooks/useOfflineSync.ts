import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { offlineSync, SyncResult } from '@/services/offlineSync';
import { offlineQueue } from '@/services/offlineQueue';

export interface UseOfflineSyncResult {
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  syncNow: () => Promise<SyncResult>;
}

export function useOfflineSync(): UseOfflineSyncResult {
  const { session } = useAuth();
  const userId = session?.user?.id || '';

  const [isSyncing, setIsSyncing] = useState<boolean>(() => offlineSync.getIsSyncing());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  const refreshCounts = useCallback(async () => {
    if (!userId) {
      setPendingCount(0);
      setFailedCount(0);
      return;
    }
    const [pending, failed] = await Promise.all([
      offlineQueue.getPendingCount(userId),
      offlineQueue.getFailedCount(userId),
    ]);
    setPendingCount(pending);
    setFailedCount(failed);
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCounts();

    const unsubSync = offlineSync.subscribe((syncing, count) => {
      setIsSyncing(syncing);
      setPendingCount(count);
      refreshCounts();
    });

    const unsubQueue = offlineQueue.subscribe((eventUserId, count) => {
      if (eventUserId === userId) {
        setPendingCount(count);
        refreshCounts();
      }
    });

    return () => {
      unsubSync();
      unsubQueue();
    };
  }, [userId, refreshCounts]);

  const syncNow = useCallback(async () => {
    return offlineSync.syncPendingOperations(userId);
  }, [userId]);

  return {
    isSyncing,
    pendingCount,
    failedCount,
    syncNow,
  };
}
