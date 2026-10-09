import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

export type SiteLaborDailyRow = Database['public']['Tables']['site_labor_daily']['Row'];
export type SiteLaborDailyInsert = Database['public']['Tables']['site_labor_daily']['Insert'];
export type SiteLaborDailyUpdate = Database['public']['Tables']['site_labor_daily']['Update'];

/**
 * Fetch labor summary for a specific site and date
 */
export async function getSiteLaborByDate(siteId: string, dateStr: string): Promise<SiteLaborDailyRow | null> {
  const { data, error } = await supabase
    .from('site_labor_daily')
    .select('*')
    .eq('site_id', siteId)
    .eq('work_date', dateStr)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found is acceptable if labor hasn't been set up for this date yet
      return null;
    }
    throw error;
  }
  return data;
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

  const { data: result, error } = await supabase
    .from('site_labor_daily')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Update labor summary for a site on a specific date
 */
export async function updateSiteLabor(id: string, data: SiteLaborDailyUpdate): Promise<SiteLaborDailyRow> {
  const { data: result, error } = await supabase
    .from('site_labor_daily')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
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
