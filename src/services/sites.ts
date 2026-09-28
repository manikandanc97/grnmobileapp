import { supabase } from '@/lib/supabase';
import { Database, SiteRow } from '@/types/database';
import { SiteItem, SiteStatus, SiteType } from '@/types/dashboard';
import { dataSync } from '@/lib/dataSync';

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
 * Format numeric budget into user-friendly currency string (e.g. ₹50L, ₹1.2Cr)
 */
export function formatSiteBudget(budget: number | null): string | undefined {
  if (budget === null || budget === undefined) return undefined;
  if (budget >= 10000000) {
    const cr = (budget / 10000000).toFixed(1).replace(/\.0$/, '');
    return `₹${cr}Cr`;
  }
  if (budget >= 100000) {
    const l = (budget / 100000).toFixed(1).replace(/\.0$/, '');
    return `₹${l}L`;
  }
  if (budget >= 1000) {
    const k = (budget / 1000).toFixed(1).replace(/\.0$/, '');
    return `₹${k}k`;
  }
  return `₹${budget}`;
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
  if (!error) return fallback;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = String((error as { message: unknown }).message).toLowerCase();
    if (msg.includes('row-level security') || msg.includes('permission denied')) {
      return 'You do not have permission to perform this action. Please verify your authentication.';
    }
    if (msg.includes('jwt') || msg.includes('token') || msg.includes('not authenticated')) {
      return 'Your session has expired. Please sign in again.';
    }
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('offline')) {
      return 'Network connection issue. Please check your internet connection.';
    }
  }
  return fallback;
}

/**
 * Fetch all active (non-deleted) sites sorted newest first
 */
export async function getSites(): Promise<SiteRow[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch sites from database.'));
  }

  return data ?? [];
}

/**
 * Fetch a single active site by UUID
 */
export async function getSiteById(id: string): Promise<SiteRow | null> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch site details.'));
  }

  return data;
}

/**
 * Insert a new site into the database
 */
export async function createSite(params: CreateSiteParams): Promise<SiteRow> {
  const insertPayload: SiteInsert = {
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

  const { data, error } = await supabase
    .from('sites')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to create new site.'));
  }

  dataSync.notify({ entity: 'sites', action: 'create', payload: data });
  return data;
}

/**
 * Update an existing site
 */
export async function updateSite(
  id: string,
  params: Partial<CreateSiteParams> & { progress?: number; status?: SiteStatus },
): Promise<SiteRow> {
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

  const { data, error } = await supabase
    .from('sites')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to update site.'));
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

  dataSync.notify({ entity: 'sites', action: 'delete', payload: { id } });
}

