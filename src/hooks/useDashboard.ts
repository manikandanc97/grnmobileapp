import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDashboardMetrics, getRecentActivity, DashboardMetrics } from '@/services/dashboard';
import { ActivityItem } from '@/types/dashboard';
import { dataSync } from '@/lib/dataSync';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const [fetchedMetrics, fetchedActivities] = await Promise.all([
        getDashboardMetrics(),
        getRecentActivity(),
      ]);

      if (isMountedRef.current) {
        setMetrics(fetchedMetrics);
        setActivities(fetchedActivities);
        dataSync.markClean('dashboard');
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        console.error('Error fetching dashboard data:', err);
        const isErrObj = typeof err === 'object' && err !== null;
        const code = isErrObj && 'code' in err ? String((err as { code: unknown }).code) : '';
        const message = isErrObj && 'message' in err ? String((err as { message: unknown }).message) : '';

        const isMissingTable = code === 'PGRST205' || message.includes('schema cache');
        setError(
          isMissingTable
            ? "Database tables not found. Please execute 'supabase/migrations/001_initial_schema.sql' in your Supabase SQL Editor."
            : (message || 'Failed to fetch dashboard data')
        );
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  // Initial load — single authoritative fetch path
  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    refetch: fetchDashboardData,
  };
}

