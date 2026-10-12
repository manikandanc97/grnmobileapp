import { useState, useEffect, useCallback } from 'react';
import { 
  getSiteLaborByDate, 
  createSiteLabor, 
  updateSiteLabor, 
  getMostRecentSiteLabor,
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

  const fetchLabor = useCallback(async () => {
    if (!siteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getSiteLaborByDate(siteId, selectedDate, userId);
      setLabor(data);
      setIsCached(isOffline && Boolean(data));
      setLastUpdated(data?.updated_at || null);
      setError(null);
    } catch (err: any) {
      const parsed = parseAppError(err, 'Failed to fetch site labor');
      setError(new Error(parsed.message));
    } finally {
      setLoading(false);
    }
  }, [siteId, selectedDate, userId, isOffline]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLabor();
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
      console.error('addLabor error:', err);
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
      console.error('editLabor error:', err);
      throw err instanceof Error ? err : new Error(err?.message || 'Failed to update site labor');
    }
  }, [siteId, selectedDate, userId]);

  const getRecentRates = useCallback(async () => {
    if (!siteId) return null;
    return await getMostRecentSiteLabor(siteId);
  }, [siteId]);

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
