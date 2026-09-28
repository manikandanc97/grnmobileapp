import { supabase } from '@/lib/supabase';
import { Database, WorkerRow } from '@/types/database';
import { formatDatabaseError } from './sites';
import { dataSync } from '@/lib/dataSync';

export type WorkerInsert = Database['public']['Tables']['workers']['Insert'];
export type WorkerUpdate = Database['public']['Tables']['workers']['Update'];

export type WorkerRole =
  | 'Mason'
  | 'Painter'
  | 'Electrician'
  | 'Plumber'
  | 'Carpenter'
  | 'Supervisor'
  | 'Laborer'
  | 'Other';

export interface WorkerWithSite extends WorkerRow {
  sites: { name: string } | null;
}

export interface CreateWorkerParams {
  site_id: string;
  name: string;
  role: WorkerRole;
  phone?: string | null;
  joining_date?: string | null;
}

/**
 * Fetch all non-deleted workers, joining with sites to get site name.
 * Optionally filter by siteId.
 */
export async function getWorkers(siteId?: string): Promise<WorkerWithSite[]> {
  let query = supabase
    .from('workers')
    .select('*, sites(name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (siteId) {
    query = query.eq('site_id', siteId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch workers from database.'));
  }

  return (data ?? []) as WorkerWithSite[];
}

/**
 * Fetch a single non-deleted worker by ID, joining with site name.
 */
export async function getWorkerById(id: string): Promise<WorkerWithSite | null> {
  const { data, error } = await supabase
    .from('workers')
    .select('*, sites(name)')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch worker details.'));
  }

  return data as WorkerWithSite | null;
}

/**
 * Create a new worker.
 */
export async function createWorker(params: CreateWorkerParams): Promise<WorkerWithSite> {
  const insertPayload: WorkerInsert = {
    site_id: params.site_id,
    name: params.name.trim(),
    role: params.role,
    phone: params.phone?.trim() || null,
    joining_date: params.joining_date || null,
  };

  const { data, error } = await supabase
    .from('workers')
    .insert(insertPayload)
    .select('*, sites(name)')
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to create new worker.'));
  }

  const created = data as WorkerWithSite;
  dataSync.notify({ entity: 'workers', action: 'create', payload: created });
  return created;
}

/**
 * Update an existing worker.
 */
export async function updateWorker(
  id: string,
  params: Partial<CreateWorkerParams>,
): Promise<WorkerWithSite> {
  const updatePayload: WorkerUpdate = {
    ...params,
  };

  const { data, error } = await supabase
    .from('workers')
    .update(updatePayload)
    .eq('id', id)
    .select('*, sites(name)')
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to update worker.'));
  }

  const updated = data as WorkerWithSite;
  dataSync.notify({ entity: 'workers', action: 'update', payload: updated });
  return updated;
}

/**
 * Soft-delete a worker by setting deleted_at.
 */
export async function softDeleteWorker(id: string): Promise<void> {
  const { error } = await supabase
    .from('workers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to delete worker.'));
  }

  dataSync.notify({ entity: 'workers', action: 'delete', payload: { id } });
}

/**
 * Get the site name from a WorkerWithSite join result safely.
 */
export function getSiteName(worker: WorkerWithSite): string {
  return worker.sites?.name ?? 'Unknown Site';
}

