import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getSiteLaborByDate, 
  createSiteLabor, 
  updateSiteLabor, 
  getSiteWageRates,
  SiteLaborDailyRow, 
  SiteLaborDailyInsert, 
  SiteLaborDailyUpdate 
} from '@/services/siteLabor';
import { dataSync } from '@/lib/dataSync';
import { useAuth } from '@/providers/AuthProvider';
import { useNetworkStatus } from './useNetworkStatus';
import { parseAppError } from '@/lib/errorHandler';

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useSiteLabor(siteId: string | undefined, initialDateStr?: string) {
  const { userId } = useAuth();
  const { isOffline } = useNetworkStatus();

  const [selectedDate, setSelectedDate] = useState(initialDateStr || getTodayStr());
  const [labor, setLabor] = useState<SiteLaborDailyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const loadedScope = useRef('');

  const fetchLabor = useCallback(async () => {
    const version = ++requestVersion.current;
    const scope = `${userId}:${siteId}:${selectedDate}`;
    if (loadedScope.current !== scope) {
      loadedScope.current = scope;
      setLabor(null);
      setError(null);
      setIsCached(false);
      setLastUpdated(null);
    }
    if (!siteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getSiteLaborByDate(siteId, selectedDate, userId);
      if (version !== requestVersion.current) return;
      setLabor(data);
      setIsCached(isOffline && Boolean(data));
      setLastUpdated(data?.updated_at || null);
      setError(null);
    } catch (err: any) {
      if (version !== requestVersion.current) return;
      const parsed = parseAppError(err, 'Failed to fetch site labor');
      setError(new Error(parsed.message));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [siteId, selectedDate, userId, isOffline]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLabor();
    return () => { requestVersion.current += 1; };
  }, [fetchLabor]);

  useEffect(() => {
    if (!siteId) return;
    const unsub = dataSync.subscribe('site_labor', () => {
      fetchLabor();
    });
    return unsub;
  }, [siteId, fetchLabor]);

  const addLabor = useCallback(async (data: Omit<SiteLaborDailyInsert, 'site_id' | 'work_date'>) => {
    if (!siteId) throw new Error('Site ID is required');
    try {
      const newLabor = await createSiteLabor({
        ...data,
        site_id: siteId,
        work_date: selectedDate
      }, userId);
      setLabor(newLabor);
      dataSync.invalidate('site_labor');
      dataSync.invalidate('site_budget');
      return newLabor;
    } catch (err: any) {
      throw err instanceof Error ? err : new Error(err?.message || 'Failed to create site labor');
    }
  }, [siteId, selectedDate, userId]);

  const editLabor = useCallback(async (id: string, data: SiteLaborDailyUpdate) => {
    if (!siteId) throw new Error('Site ID is required');
    try {
      const updatedLabor = await updateSiteLabor(id, {
        ...data,
        site_id: siteId,
        work_date: selectedDate,
      }, userId);
      setLabor(updatedLabor);
      dataSync.invalidate('site_labor');
      dataSync.invalidate('site_budget');
      return updatedLabor;
    } catch (err: any) {
      throw err instanceof Error ? err : new Error(err?.message || 'Failed to update site labor');
    }
  }, [siteId, selectedDate, userId]);

  const getRecentRates = useCallback(async () => {
    if (!siteId) return null;
    return await getSiteWageRates(siteId, userId);
  }, [siteId, userId]);

  return { 
    selectedDate, 
    setSelectedDate,
    labor, 
    loading, 
    error, 
    isOffline,
    isCached,
    lastUpdated,
    refetch: fetchLabor, 
    addLabor, 
    editLabor,
    getRecentRates
  };
}
