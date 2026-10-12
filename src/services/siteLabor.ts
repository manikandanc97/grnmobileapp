import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { createNotification } from './notifications';
import { offlineStorage } from './offlineStorage';
import { offlineQueue } from './offlineQueue';
import { networkStatus } from './networkStatus';
import { dataSync } from '@/lib/dataSync';

export type SiteLaborDailyRow = Database['public']['Tables']['site_labor_daily']['Row'];
export type SiteLaborDailyInsert = Database['public']['Tables']['site_labor_daily']['Insert'];
export type SiteLaborDailyUpdate = Database['public']['Tables']['site_labor_daily']['Update'];

async function resolveUserId(userId?: string): Promise<string> {
  if (userId) return userId;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || '';
  } catch {
    return '';
  }
}

/**
 * Fetch labor summary for a specific site and date with account-isolated cache fallback
 */
export async function getSiteLaborByDate(
  siteId: string,
  dateStr: string,
  userId?: string
): Promise<SiteLaborDailyRow | null> {
  const currentUserId = await resolveUserId(userId);
  const cacheKey = `labor_${siteId}_${dateStr}`;
  let localData: Partial<SiteLaborDailyRow> | null = null;

  if (currentUserId) {
    const cached = await offlineStorage.get<SiteLaborDailyRow>(currentUserId, cacheKey);
    if (cached) localData = cached.data;
  }

  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('site_labor_daily')
        .select('*')
        .eq('site_id', siteId)
        .eq('work_date', dateStr)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record doesn't exist on server. Return local draft if user edited offline, else null
          return (localData as SiteLaborDailyRow) || null;
        }
        throw error;
      }

      if (data && currentUserId) {
        await offlineStorage.set(currentUserId, cacheKey, data);
      }

      return {
        ...localData,
        ...data,
        painter_count: data.painter_count ?? localData?.painter_count ?? 0,
        painter_rate: data.painter_rate ?? localData?.painter_rate ?? 0,
        carpenter_count: data.carpenter_count ?? localData?.carpenter_count ?? 0,
        carpenter_rate: data.carpenter_rate ?? localData?.carpenter_rate ?? 0,
        plumber_count: data.plumber_count ?? localData?.plumber_count ?? 0,
        plumber_rate: data.plumber_rate ?? localData?.plumber_rate ?? 0,
        electrician_count: data.electrician_count ?? localData?.electrician_count ?? 0,
        electrician_rate: data.electrician_rate ?? localData?.electrician_rate ?? 0,
        bar_bender_count: data.bar_bender_count ?? localData?.bar_bender_count ?? 0,
        bar_bender_rate: data.bar_bender_rate ?? localData?.bar_bender_rate ?? 0,
        welder_count: data.welder_count ?? localData?.welder_count ?? 0,
        welder_rate: data.welder_rate ?? localData?.welder_rate ?? 0,
        flooring_count: data.flooring_count ?? localData?.flooring_count ?? 0,
        flooring_rate: data.flooring_rate ?? localData?.flooring_rate ?? 0,
      };
    } catch (err: any) {
      if (__DEV__) {
        console.warn('[siteLabor] Error fetching from remote, checking cache:', err);
      }
      if (localData) {
        return localData as SiteLaborDailyRow;
      }
      throw err;
    }
  }

  // Offline: return local data
  return (localData as SiteLaborDailyRow) || null;
}

/**
 * Fetch historical labor summaries for a specific site with offline fallback
 */
export async function getSiteLaborHistory(
  siteId: string,
  fromDate?: string,
  toDate?: string,
  userId?: string
): Promise<SiteLaborDailyRow[]> {
  const currentUserId = await resolveUserId(userId);
  const cacheKey = `labor_history_${siteId}`;
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      let query = supabase
        .from('site_labor_daily')
        .select('*')
        .eq('site_id', siteId)
        .order('work_date', { ascending: false });
        
      if (fromDate) {
        query = query.gte('work_date', fromDate);
      }
      if (toDate) {
        query = query.lte('work_date', toDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const historyData = data || [];
      if (currentUserId && !fromDate && !toDate) {
        await offlineStorage.set(currentUserId, cacheKey, historyData);
      }
      return historyData;
    } catch (err) {
      if (__DEV__) {
        console.warn('[siteLabor] Error fetching history, trying cache:', err);
      }
      if (currentUserId) {
        const cached = await offlineStorage.get<SiteLaborDailyRow[]>(currentUserId, cacheKey);
        if (cached && cached.data) return cached.data;
      }
      throw err;
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<SiteLaborDailyRow[]>(currentUserId, cacheKey);
    if (cached && cached.data) return cached.data;
  }
  return [];
}

/**
 * Helper to check if an error is due to missing columns in DB or PostgREST schema cache
 */
function isMissingColumnError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || err?.error?.code || '');
  const msg = String(err.message || err?.error?.message || '');
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('Could not find')
  );
}

/**
 * Helper to strip optional extended columns if remote schema doesn't have them yet
 */
function toBaseInsert(data: SiteLaborDailyInsert): SiteLaborDailyInsert {
  return {
    owner_id: data.owner_id,
    site_id: data.site_id,
    work_date: data.work_date,
    mason_count: data.mason_count ?? 0,
    mason_rate: data.mason_rate ?? 0,
    men_helper_count: data.men_helper_count ?? 0,
    men_helper_rate: data.men_helper_rate ?? 0,
    women_helper_count: data.women_helper_count ?? 0,
    women_helper_rate: data.women_helper_rate ?? 0,
  };
}

/**
 * Helper to extract only defined base columns for update
 */
function toBaseUpdate(data: SiteLaborDailyUpdate): SiteLaborDailyUpdate {
  const payload: SiteLaborDailyUpdate = {};
  if (data.mason_count !== undefined) payload.mason_count = data.mason_count;
  if (data.mason_rate !== undefined) payload.mason_rate = data.mason_rate;
  if (data.men_helper_count !== undefined) payload.men_helper_count = data.men_helper_count;
  if (data.men_helper_rate !== undefined) payload.men_helper_rate = data.men_helper_rate;
  if (data.women_helper_count !== undefined) payload.women_helper_count = data.women_helper_count;
  if (data.women_helper_rate !== undefined) payload.women_helper_rate = data.women_helper_rate;
  if (data.work_date !== undefined) payload.work_date = data.work_date;
  if (data.site_id !== undefined) payload.site_id = data.site_id;
  if (data.owner_id !== undefined) payload.owner_id = data.owner_id;
  return payload;
}

/**
 * Create labor summary for a site on a specific date with offline queue support
 */
export async function createSiteLabor(data: SiteLaborDailyInsert, userId?: string): Promise<SiteLaborDailyRow> {
  const currentUserId = await resolveUserId(userId || data.owner_id);
  const insertData = { ...data, owner_id: currentUserId };

  const cacheKey = `labor_${insertData.site_id}_${insertData.work_date}`;
  if (currentUserId) {
    await offlineStorage.set(currentUserId, cacheKey, insertData);
  }

  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected && currentUserId) {
    // Offline: queue mutation
    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'site_labor',
      entity_id: `${insertData.site_id}_${insertData.work_date}`,
      operation_type: 'create',
      payload: insertData,
    });
    dataSync.notify({ entity: 'site_labor', action: 'update', payload: insertData as any });
    return insertData as SiteLaborDailyRow;
  }

  try {
    const { data: result, error } = await supabase
      .from('site_labor_daily')
      .upsert([insertData], { onConflict: 'site_id,work_date' })
      .select()
      .single();

    if (error) throw error;
    const totalWorkers = calculateRecordLaborCount(insertData);
    createNotification({
      title: 'Daily Labor Recorded',
      message: `${totalWorkers} workers recorded for ${insertData.work_date}`,
      type: 'attendance',
      site_id: insertData.site_id,
    }).catch(() => {});

    dataSync.notify({ entity: 'site_labor', action: 'update', payload: result });
    return { ...insertData, ...result };
  } catch (err: any) {
    const isNetwork =
      err?.message?.includes('Network request failed') ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('timeout');

    if (isNetwork && currentUserId) {
      await offlineQueue.enqueue({
        owner_id: currentUserId,
        entity_type: 'site_labor',
        entity_id: `${insertData.site_id}_${insertData.work_date}`,
        operation_type: 'create',
        payload: insertData,
      });
      dataSync.notify({ entity: 'site_labor', action: 'update', payload: insertData as any });
      return insertData as SiteLaborDailyRow;
    }

    if (isMissingColumnError(err)) {
      console.warn('[siteLabor] Database missing extended worker columns, saving base columns:', err?.message || err);
      const basePayload = toBaseInsert(insertData);
      const { data: baseResult, error: baseError } = await supabase
        .from('site_labor_daily')
        .upsert([basePayload], { onConflict: 'site_id,work_date' })
        .select()
        .single();
      if (baseError) throw baseError;
      dataSync.notify({ entity: 'site_labor', action: 'update', payload: baseResult });
      return { ...insertData, ...baseResult };
    }
    throw err;
  }
}

/**
 * Update labor summary for a site on a specific date
 */
export async function updateSiteLabor(id: string, data: SiteLaborDailyUpdate, userId?: string): Promise<SiteLaborDailyRow> {
  const currentUserId = await resolveUserId(userId || data.owner_id);

  if (data.site_id && data.work_date && currentUserId) {
    const cacheKey = `labor_${data.site_id}_${data.work_date}`;
    await offlineStorage.set(currentUserId, cacheKey, { ...data, id });
  }

  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected && currentUserId) {
    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'site_labor',
      entity_id: id,
      operation_type: 'update',
      payload: data,
    });
    dataSync.notify({ entity: 'site_labor', action: 'update', payload: { ...data, id } as any });
    return { ...data, id } as SiteLaborDailyRow;
  }

  try {
    const { data: result, error } = await supabase
      .from('site_labor_daily')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    dataSync.notify({ entity: 'site_labor', action: 'update', payload: result });
    return { ...data, ...result };
  } catch (err: any) {
    const isNetwork =
      err?.message?.includes('Network request failed') ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('timeout');

    if (isNetwork && currentUserId) {
      await offlineQueue.enqueue({
        owner_id: currentUserId,
        entity_type: 'site_labor',
        entity_id: id,
        operation_type: 'update',
        payload: data,
      });
      dataSync.notify({ entity: 'site_labor', action: 'update', payload: { ...data, id } as any });
      return { ...data, id } as SiteLaborDailyRow;
    }

    if (isMissingColumnError(err)) {
      console.warn('[siteLabor] Database missing extended worker columns, updating base columns:', err?.message || err);
      const basePayload = toBaseUpdate(data);
      const { data: baseResult, error: baseError } = await supabase
        .from('site_labor_daily')
        .update(basePayload)
        .eq('id', id)
        .select()
        .single();
      if (baseError) throw baseError;
      dataSync.notify({ entity: 'site_labor', action: 'update', payload: baseResult });
      return { ...data, ...baseResult };
    }
    throw err;
  }
}

/**
 * Get most recent labor entry for a site (e.g. to prefill today's data)
 */
export async function getMostRecentSiteLabor(siteId: string): Promise<SiteLaborDailyRow | null> {
  const { data, error } = await supabase
    .from('site_labor_daily')
    .select('*')
    .eq('site_id', siteId)
    .order('work_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  if (!data) return null;

  return {
    ...data,
    painter_count: data.painter_count ?? 0,
    painter_rate: data.painter_rate ?? 0,
    carpenter_count: data.carpenter_count ?? 0,
    carpenter_rate: data.carpenter_rate ?? 0,
    plumber_count: data.plumber_count ?? 0,
    plumber_rate: data.plumber_rate ?? 0,
    electrician_count: data.electrician_count ?? 0,
    electrician_rate: data.electrician_rate ?? 0,
    bar_bender_count: data.bar_bender_count ?? 0,
    bar_bender_rate: data.bar_bender_rate ?? 0,
    welder_count: data.welder_count ?? 0,
    welder_rate: data.welder_rate ?? 0,
    flooring_count: data.flooring_count ?? 0,
    flooring_rate: data.flooring_rate ?? 0,
  };
}

export interface WorkerRoleConfig {
  key: string;
  label: string;
  countKey: keyof SiteLaborDailyRow;
  rateKey: keyof SiteLaborDailyRow;
  defaultRate: number;
}

export const WORKER_ROLES = [
  { key: 'mason', label: 'Masons', countKey: 'mason_count', rateKey: 'mason_rate', defaultRate: 1200 },
  { key: 'men_helper', label: 'Men Helpers', countKey: 'men_helper_count', rateKey: 'men_helper_rate', defaultRate: 800 },
  { key: 'women_helper', label: 'Women Helpers', countKey: 'women_helper_count', rateKey: 'women_helper_rate', defaultRate: 650 },
  { key: 'painter', label: 'Painters', countKey: 'painter_count', rateKey: 'painter_rate', defaultRate: 1000 },
  { key: 'carpenter', label: 'Carpenters', countKey: 'carpenter_count', rateKey: 'carpenter_rate', defaultRate: 1100 },
  { key: 'plumber', label: 'Plumbers', countKey: 'plumber_count', rateKey: 'plumber_rate', defaultRate: 1000 },
  { key: 'electrician', label: 'Electricians', countKey: 'electrician_count', rateKey: 'electrician_rate', defaultRate: 1000 },
  { key: 'bar_bender', label: 'Bar Benders', countKey: 'bar_bender_count', rateKey: 'bar_bender_rate', defaultRate: 1050 },
  { key: 'welder', label: 'Welders', countKey: 'welder_count', rateKey: 'welder_rate', defaultRate: 1000 },
  { key: 'flooring', label: 'Tile / Flooring', countKey: 'flooring_count', rateKey: 'flooring_rate', defaultRate: 1150 },
] as const;

export function calculateRecordLaborCost(record: Partial<SiteLaborDailyRow> | null | undefined): number {
  if (!record) return 0;
  return WORKER_ROLES.reduce((sum, role) => {
    const count = Number((record as any)[role.countKey]) || 0;
    const rate = Number((record as any)[role.rateKey]) || 0;
    return sum + count * rate;
  }, 0);
}

export function calculateRecordLaborCount(record: Partial<SiteLaborDailyRow> | null | undefined): number {
  if (!record) return 0;
  return WORKER_ROLES.reduce((sum, role) => {
    const count = Number((record as any)[role.countKey]) || 0;
    return sum + count;
  }, 0);
}
