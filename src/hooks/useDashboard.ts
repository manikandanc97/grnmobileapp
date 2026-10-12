import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDashboardMetricsWithCache, getRecentActivity, DashboardMetrics } from '@/services/dashboard';
import { ActivityItem } from '@/types/dashboard';
import { dataSync } from '@/lib/dataSync';
import { useAuth } from '@/providers/AuthProvider';
import { useNetworkStatus } from './useNetworkStatus';
import { parseAppError } from '@/lib/errorHandler';

export function useDashboard() {
  const { userId } = useAuth();
  const { isOffline } = useNetworkStatus();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!isSilent) {
        setLoading(true);
      }
      setError(null);

      const [metricsRes, fetchedActivities] = await Promise.all([
        getDashboardMetricsWithCache(userId),
        getRecentActivity(userId),
      ]);

      if (isMountedRef.current) {
        setMetrics(metricsRes.data);
        setIsCached(metricsRes.isCached);
        setLastUpdated(metricsRes.cachedAt);
        setActivities(fetchedActivities);
        dataSync.markClean('dashboard');
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const parsed = parseAppError(err, 'Failed to fetch dashboard data');
        setError(parsed.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [userId]);

  // Initial load — single authoritative fetch path
  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Live synchronization subscription
  useEffect(() => {
    const unsubscribe = dataSync.subscribe('dashboard', () => {
      fetchDashboardData(true);
    });

    return unsubscribe;
  }, [fetchDashboardData]);

  // Intelligent navigation focus revalidation (only if marked stale)
  useFocusEffect(
    useCallback(() => {
      if (dataSync.isStale('dashboard')) {
        fetchDashboardData(true);
      }
    }, [fetchDashboardData])
  );

  return {
    metrics,
    activities,
    loading,
    error,
    isOffline,
    isCached,
    lastUpdated,
    refetch: fetchDashboardData,
  };
}

