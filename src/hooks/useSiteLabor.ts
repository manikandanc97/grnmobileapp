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

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useSiteLabor(siteId: string | undefined, initialDateStr?: string) {
  const [selectedDate, setSelectedDate] = useState(initialDateStr || getTodayStr());
  const [labor, setLabor] = useState<SiteLaborDailyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLabor = useCallback(async () => {
    if (!siteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getSiteLaborByDate(siteId, selectedDate);
      setLabor(data);
      setError(null);
    } catch (err: any) {
      console.error('Fetch labor error:', err);
      let errMsg = err?.message || 'Failed to fetch site labor';
      if (err?.code === 'PGRST205' || errMsg.includes('schema cache')) {
        errMsg = 'Database table is missing. Please run `npx supabase db push` to apply migrations.';
      }
      setError(new Error(errMsg));
    } finally {
      setLoading(false);
    }
  }, [siteId, selectedDate]);

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

  const addLabor = async (data: Omit<SiteLaborDailyInsert, 'site_id' | 'work_date'>) => {
    if (!siteId) throw new Error('Site ID is required');
    try {
      const newLabor = await createSiteLabor({
        ...data,
        site_id: siteId,
        work_date: selectedDate
      });
      setLabor(newLabor);
      dataSync.invalidate('site_labor');
      dataSync.invalidate('site_budget');
      return newLabor;
    } catch (err: any) {
      console.error('addLabor error:', err);
      throw err instanceof Error ? err : new Error(err?.message || 'Failed to create site labor');
    }
  };

  const editLabor = async (id: string, data: SiteLaborDailyUpdate) => {
    if (!siteId) throw new Error('Site ID is required');
    try {
      const updatedLabor = await updateSiteLabor(id, data);
      setLabor(updatedLabor);
      dataSync.invalidate('site_labor');
      dataSync.invalidate('site_budget');
      return updatedLabor;
    } catch (err: any) {
      console.error('editLabor error:', err);
      throw err instanceof Error ? err : new Error(err?.message || 'Failed to update site labor');
    }
  };

  const getRecentRates = async () => {
    if (!siteId) return null;
    return await getMostRecentSiteLabor(siteId);
  };

  return { 
    selectedDate, 
    setSelectedDate,
    labor, 
    loading, 
    error, 
    refetch: fetchLabor, 
    addLabor, 
    editLabor,
    getRecentRates
  };
}
