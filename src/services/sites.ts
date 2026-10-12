import { parseAppError } from '@/lib/errorHandler';
import { formatCurrency } from '@/lib/finance';
import { supabase } from '@/lib/supabase';
import { Database, SiteRow } from '@/types/database';
import { SiteItem, SiteStatus, SiteType } from '@/types/dashboard';
import { dataSync } from '@/lib/dataSync';
import { offlineStorage } from './offlineStorage';
import { offlineQueue, generateUUID } from './offlineQueue';
import { networkStatus } from './networkStatus';

export type SiteInsert = Database['public']['Tables']['sites']['Insert'];
export type SiteUpdate = Database['public']['Tables']['sites']['Update'];

export interface CreateSiteParams {
  name: string;
  location: string;
  type: SiteType;
  startDate?: string;
  expectedCompletion?: string;
  budget?: string;
}

/**
 * Format numeric budget into user-friendly currency string using centralized formatCurrency
 */
export function formatSiteBudget(budget: number | null): string | undefined {
  if (budget === null || budget === undefined) return undefined;
  return formatCurrency(budget);
}

/**
 * Parse input string into a standard numeric budget
 */
export function parseBudgetInput(value: string): number | null {
  if (!value || !value.trim()) return null;
  const clean = value.replace(/[₹,\s]/g, '').toLowerCase();
  if (clean.endsWith('cr')) {
    const num = parseFloat(clean.replace('cr', ''));
    return isNaN(num) ? null : num * 10000000;
  }
  if (clean.endsWith('l') || clean.endsWith('lakh')) {
    const num = parseFloat(clean.replace(/lakh|l/, ''));
    return isNaN(num) ? null : num * 100000;
  }
  if (clean.endsWith('k')) {
    const num = parseFloat(clean.replace('k', ''));
    return isNaN(num) ? null : num * 1000;
  }
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

/**
 * Parse input date string (e.g. DD/MM/YYYY or YYYY-MM-DD) into YYYY-MM-DD for PostgreSQL
 */
export function parseDateInput(value: string): string | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[2].length === 4) {
      // DD/MM/YYYY -> YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (parts[0].length === 4 && parts[2].length <= 2) {
      // YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

/**
 * Transform PostgreSQL row into UI SiteItem model
 */
export function transformSiteRow(row: SiteRow): SiteItem {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    type: (row.type as SiteType) || 'Residential',
    progress: Number(row.progress) || 0,
    status: (row.status as SiteStatus) || 'In Progress',
    startDate: row.start_date ?? undefined,
    expectedCompletion: row.expected_completion ?? undefined,
    budget: row.budget !== null ? formatSiteBudget(row.budget) : undefined,
  };
}

/**
 * Convert raw database errors into user-friendly message strings
 */
export function formatDatabaseError(error: unknown, fallback: string): string {
  return parseAppError(error, fallback).message;
}

async function resolveCurrentUserId(fallbackUserId?: string): Promise<string> {
  if (fallbackUserId) return fallbackUserId;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || '';
  } catch {
    return '';
  }
}

export interface SitesFetchResult {
  data: SiteRow[];
  isCached: boolean;
  cachedAt: string | null;
}

/**
 * Fetch all active (non-deleted) sites with offline cache fallback
 */
export async function getSitesWithCache(userId?: string): Promise<SitesFetchResult> {
  const currentUserId = await resolveCurrentUserId(userId);
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sitesData = data ?? [];
      if (currentUserId) {
        await offlineStorage.set(currentUserId, 'sites_list', sitesData);
      }
      return { data: sitesData, isCached: false, cachedAt: null };
    } catch (err) {
      if (__DEV__) {
        console.warn('[sites] Remote fetch failed, checking cache:', err);
      }
      // If network fails, attempt cache fallback
      if (currentUserId) {
        const cached = await offlineStorage.get<SiteRow[]>(currentUserId, 'sites_list');
        if (cached && cached.data) {
          return { data: cached.data, isCached: true, cachedAt: cached.cachedAt };
        }
      }
      throw new Error(formatDatabaseError(err, 'Failed to fetch sites from database.'));
    }
  }

  // Currently offline
  if (currentUserId) {
    const cached = await offlineStorage.get<SiteRow[]>(currentUserId, 'sites_list');
    if (cached && cached.data) {
      return { data: cached.data, isCached: true, cachedAt: cached.cachedAt };
    }
  }

  throw new Error('Unable to connect. No cached sites available offline.');
}

/**
 * Fetch all active sites (backwards-compatible array return)
 */
export async function getSites(userId?: string): Promise<SiteRow[]> {
  const res = await getSitesWithCache(userId);
  return res.data;
}

/**
 * Fetch a single active site by UUID with offline cache fallback
 */
export async function getSiteById(id: string, userId?: string): Promise<SiteRow | null> {
  const currentUserId = await resolveCurrentUserId(userId);
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      if (data && currentUserId) {
        await offlineStorage.set(currentUserId, `site_${id}`, data);
      }
      return data;
    } catch (err) {
      if (currentUserId) {
        const cached = await offlineStorage.get<SiteRow>(currentUserId, `site_${id}`);
        if (cached) return cached.data;
      }
      throw new Error(formatDatabaseError(err, 'Failed to fetch site details.'));
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<SiteRow>(currentUserId, `site_${id}`);
    if (cached) return cached.data;

    // Check in cached sites list
    const cachedList = await offlineStorage.get<SiteRow[]>(currentUserId, 'sites_list');
    if (cachedList && cachedList.data) {
      const match = cachedList.data.find((s) => s.id === id);
      if (match) return match;
    }
  }

  throw new Error('Unable to connect to fetch site details.');
}

/**
 * Insert a new site into the database or durable offline queue
 */
export async function createSite(params: CreateSiteParams, userId?: string): Promise<SiteRow> {
  const currentUserId = await resolveCurrentUserId(userId);
  const siteId = generateUUID();

  const insertPayload: SiteInsert = {
    id: siteId,
    name: params.name.trim(),
    location: params.location.trim(),
    type: params.type,
    progress: 0,
    status: 'In Progress',
    start_date: params.startDate ? parseDateInput(params.startDate) : null,
    expected_completion: params.expectedCompletion
      ? parseDateInput(params.expectedCompletion)
      : null,
    budget: params.budget ? parseBudgetInput(params.budget) : null,
  };

  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected) {
    // Offline: queue mutation & update cache immediately
    const optimisticRow: SiteRow = {
      ...(insertPayload as any),
      id: siteId,
      owner_id: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    if (currentUserId) {
      await offlineQueue.enqueue({
        owner_id: currentUserId,
        entity_type: 'sites',
        entity_id: siteId,
        operation_type: 'create',
        payload: insertPayload,
      });

      // Update cached sites list
      const cached = await offlineStorage.get<SiteRow[]>(currentUserId, 'sites_list');
      const currentList = cached?.data || [];
      await offlineStorage.set(currentUserId, 'sites_list', [optimisticRow, ...currentList]);
      await offlineStorage.set(currentUserId, `site_${siteId}`, optimisticRow);
    }

    dataSync.notify({ entity: 'sites', action: 'create', payload: optimisticRow });
    return optimisticRow;
  }

  // Online: execute via Supabase upsert
  try {
    const { data, error } = await supabase
      .from('sites')
      .upsert(insertPayload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    if (currentUserId) {
      const cached = await offlineStorage.get<SiteRow[]>(currentUserId, 'sites_list');
      const currentList = cached?.data || [];
      const updatedList = [data, ...currentList.filter((s) => s.id !== data.id)];
      await offlineStorage.set(currentUserId, 'sites_list', updatedList);
      await offlineStorage.set(currentUserId, `site_${data.id}`, data);
    }

    dataSync.notify({ entity: 'sites', action: 'create', payload: data });
    return data;
  } catch (err: any) {
    const isNetwork =
      err?.message?.includes('Network request failed') ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('timeout');

    if (isNetwork && currentUserId) {
      // Graceful fallback to durable queue
      const optimisticRow: SiteRow = {
        ...(insertPayload as any),
        id: siteId,
        owner_id: currentUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      await offlineQueue.enqueue({
        owner_id: currentUserId,
        entity_type: 'sites',
        entity_id: siteId,
        operation_type: 'create',
        payload: insertPayload,
      });

      const cached = await offlineStorage.get<SiteRow[]>(currentUserId, 'sites_list');
      const currentList = cached?.data || [];
      await offlineStorage.set(currentUserId, 'sites_list', [optimisticRow, ...currentList]);

      dataSync.notify({ entity: 'sites', action: 'create', payload: optimisticRow });
      return optimisticRow;
    }

    throw new Error(formatDatabaseError(err, 'Failed to create new site.'));
  }
}

/**
 * Update an existing site
 */
export async function updateSite(
  id: string,
  params: Partial<CreateSiteParams> & { progress?: number; status?: SiteStatus },
  userId?: string,
): Promise<SiteRow> {
  const currentUserId = await resolveCurrentUserId(userId);
  const updatePayload: SiteUpdate = {
    ...(params.name ? { name: params.name.trim() } : {}),
    ...(params.location ? { location: params.location.trim() } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.progress !== undefined ? { progress: params.progress } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.startDate !== undefined ? { start_date: parseDateInput(params.startDate) } : {}),
    ...(params.expectedCompletion !== undefined
      ? { expected_completion: parseDateInput(params.expectedCompletion) }
      : {}),
    ...(params.budget !== undefined ? { budget: parseBudgetInput(params.budget) } : {}),
    updated_at: new Date().toISOString(),
  };

  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected && currentUserId) {
    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'sites',
      entity_id: id,
      operation_type: 'update',
      payload: updatePayload,
    });

    const cached = await offlineStorage.get<SiteRow>(currentUserId, `site_${id}`);
    const updatedRow = { ...(cached?.data || {}), ...updatePayload, id } as SiteRow;
    await offlineStorage.set(currentUserId, `site_${id}`, updatedRow);

    const listCached = await offlineStorage.get<SiteRow[]>(currentUserId, 'sites_list');
    if (listCached) {
      const updatedList = listCached.data.map((s) => (s.id === id ? updatedRow : s));
      await offlineStorage.set(currentUserId, 'sites_list', updatedList);
    }

    dataSync.notify({ entity: 'sites', action: 'update', payload: updatedRow });
    return updatedRow;
  }

  const { data, error } = await supabase
    .from('sites')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to update site.'));
  }

  if (currentUserId) {
    await offlineStorage.set(currentUserId, `site_${id}`, data);
    const listCached = await offlineStorage.get<SiteRow[]>(currentUserId, 'sites_list');
    if (listCached) {
      const updatedList = listCached.data.map((s) => (s.id === id ? data : s));
      await offlineStorage.set(currentUserId, 'sites_list', updatedList);
    }
  }

  dataSync.notify({ entity: 'sites', action: 'update', payload: data });
  return data;
}

/**
 * Soft delete an existing site
 */
export async function softDeleteSite(id: string): Promise<void> {
  const { error } = await supabase
    .from('sites')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to delete site.'));
  }

  const currentUserId = await resolveCurrentUserId();
  if (currentUserId) {
    await offlineStorage.remove(currentUserId, `site_${id}`);
    const listCached = await offlineStorage.get<SiteRow[]>(currentUserId, 'sites_list');
    if (listCached) {
      const updatedList = listCached.data.filter((s) => s.id !== id);
      await offlineStorage.set(currentUserId, 'sites_list', updatedList);
    }
  }

  dataSync.notify({ entity: 'sites', action: 'delete', payload: { id } });
}

