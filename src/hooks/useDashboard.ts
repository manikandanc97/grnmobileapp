import { useState, useEffect, useCallback } from 'react';
import { getDashboardMetrics, getRecentActivity, DashboardMetrics } from '@/services/dashboard';
import { ActivityItem } from '@/types/dashboard';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [fetchedMetrics, fetchedActivities] = await Promise.all([
        getDashboardMetrics(),
        getRecentActivity(),
      ]);

      setMetrics(fetchedMetrics);
      setActivities(fetchedActivities);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const isMissingTable = err?.code === 'PGRST205' || err?.message?.includes('schema cache');
      setError(
        isMissingTable
          ? "Database tables not found. Please execute 'supabase/migrations/001_initial_schema.sql' in your Supabase SQL Editor."
          : (err?.message || 'Failed to fetch dashboard data')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [fetchedMetrics, fetchedActivities] = await Promise.all([
          getDashboardMetrics(),
          getRecentActivity(),
        ]);
        if (isMounted) {
          setMetrics(fetchedMetrics);
          setActivities(fetchedActivities);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching dashboard data:', err);
          const isMissingTable = err?.code === 'PGRST205' || err?.message?.includes('schema cache');
          setError(
            isMissingTable
              ? "Database tables not found. Please execute 'supabase/migrations/001_initial_schema.sql' in your Supabase SQL Editor."
              : (err?.message || 'Failed to fetch dashboard data')
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    metrics,
    activities,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
