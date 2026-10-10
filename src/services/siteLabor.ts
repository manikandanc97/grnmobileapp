import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SiteLaborDailyRow = Database['public']['Tables']['site_labor_daily']['Row'];
export type SiteLaborDailyInsert = Database['public']['Tables']['site_labor_daily']['Insert'];
export type SiteLaborDailyUpdate = Database['public']['Tables']['site_labor_daily']['Update'];

const getCacheKey = (siteId: string, date: string) => `@grn_labor_${siteId}_${date}`;

/**
 * Fetch labor summary for a specific site and date
 */
export async function getSiteLaborByDate(siteId: string, dateStr: string): Promise<SiteLaborDailyRow | null> {
  let localData: Partial<SiteLaborDailyRow> | null = null;
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(siteId, dateStr));
    if (raw) localData = JSON.parse(raw);
  } catch (e) {
    // ignore local storage error
  }

  const { data, error } = await supabase
    .from('site_labor_daily')
    .select('*')
    .eq('site_id', siteId)
    .eq('work_date', dateStr)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return (localData as SiteLaborDailyRow) || null;
    }
    throw error;
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
}

/**
 * Fetch historical labor summaries for a specific site
 */
export async function getSiteLaborHistory(siteId: string, fromDate?: string, toDate?: string): Promise<SiteLaborDailyRow[]> {
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
  return data || [];
}

/**
 * Helper to strip optional extended columns if remote schema doesn't have them yet
 */
function toBaseInsert(data: any) {
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
 * Create labor summary for a site on a specific date
 */
export async function createSiteLabor(data: SiteLaborDailyInsert): Promise<SiteLaborDailyRow> {
  let insertData = { ...data };
  if (!insertData.owner_id) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (userData.user) {
      insertData.owner_id = userData.user.id;
    }
  }

  try {
    await AsyncStorage.setItem(getCacheKey(insertData.site_id, insertData.work_date), JSON.stringify(insertData));
  } catch (e) {
    // ignore storage error
  }

  try {
    const { data: result, error } = await supabase
      .from('site_labor_daily')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return { ...insertData, ...result };
  } catch (err: any) {
    // Fallback if remote DB hasn't run migration 010 yet
    if (err?.code === '42703' || (err?.message && err.message.includes('does not exist'))) {
      const basePayload = toBaseInsert(insertData);
      const { data: baseResult, error: baseError } = await supabase
        .from('site_labor_daily')
        .insert([basePayload])
        .select()
        .single();
      if (baseError) throw baseError;
      return { ...insertData, ...baseResult };
    }
    throw err;
  }
}

/**
 * Update labor summary for a site on a specific date
 */
export async function updateSiteLabor(id: string, data: SiteLaborDailyUpdate): Promise<SiteLaborDailyRow> {
  if (data.site_id && data.work_date) {
    try {
      await AsyncStorage.setItem(getCacheKey(data.site_id, data.work_date), JSON.stringify(data));
    } catch (e) {
      // ignore storage error
    }
  }

  try {
    const { data: result, error } = await supabase
      .from('site_labor_daily')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { ...data, ...result };
  } catch (err: any) {
    // Fallback if remote DB hasn't run migration 010 yet
    if (err?.code === '42703' || (err?.message && err.message.includes('does not exist'))) {
      const basePayload = {
        mason_count: data.mason_count,
        mason_rate: data.mason_rate,
        men_helper_count: data.men_helper_count,
        men_helper_rate: data.men_helper_rate,
        women_helper_count: data.women_helper_count,
        women_helper_rate: data.women_helper_rate,
      };
      const { data: baseResult, error: baseError } = await supabase
        .from('site_labor_daily')
        .update(basePayload)
        .eq('id', id)
        .select()
        .single();
      if (baseError) throw baseError;
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
  return data;
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
